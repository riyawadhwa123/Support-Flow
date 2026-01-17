import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateGeminiResponse, type GeminiMessage } from '@/lib/gemini';

const SESSION_COOKIE = 'sf_chat_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_IMAGE_BASE64_LENGTH = 8 * 1024 * 1024; // ~8MB

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string | null;
  image_url: string | null;
  created_at: string;
};

function buildDataUrl(imageBase64: string, mimeType?: string) {
  return `data:${mimeType || 'image/png'};base64,${imageBase64}`;
}

function extractInlineData(imageUrl?: string | null) {
  if (!imageUrl) return null;
  const match = /^data:(.*?);base64,(.*)$/.exec(imageUrl);
  if (!match) return null;
  const [, mimeType, data] = match;
  return { mimeType: mimeType || 'image/png', base64: data };
}

function toGeminiMessages(history: ChatMessageRow[]): GeminiMessage[] {
  return history.map((message) => {
    const inline = extractInlineData(message.image_url || undefined);
    return {
      role: message.role,
      content: message.content || '',
      imageBase64: inline?.base64,
      imageMimeType: inline?.mimeType,
    };
  });
}

function ensureSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function GET() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const supabase = await createClient();

  if (!sessionId) {
    sessionId = randomUUID();
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch chat history', error);
    const response = NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
    ensureSessionCookie(response, sessionId);
    return response;
  }

  const response = NextResponse.json({
    sessionId,
    messages: data || [],
  });
  ensureSessionCookie(response, sessionId);
  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const text: string = (body?.message || '').toString().trim();
  const imageBase64: string | undefined =
    typeof body?.imageBase64 === 'string' && body?.imageBase64.trim()
      ? body.imageBase64.trim()
      : undefined;
  const imageMimeType: string | undefined =
    typeof body?.imageMimeType === 'string' && body?.imageMimeType.trim()
      ? body.imageMimeType.trim()
      : undefined;

  if (!text && !imageBase64) {
    return NextResponse.json(
      { error: 'Please provide a message or an image.' },
      { status: 400 }
    );
  }

  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: 'Message is too long. Please keep it under 4000 characters.' },
      { status: 400 }
    );
  }

  if (imageBase64 && imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    return NextResponse.json(
      { error: 'Image is too large. Please upload an image under 8MB.' },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const supabase = await createClient();

  if (!sessionId) {
    sessionId = randomUUID();
  }

  const imageUrl = imageBase64 ? buildDataUrl(imageBase64, imageMimeType) : null;

  const { data: insertedUserMessage, error: insertUserError } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      role: 'user',
      content: text || null,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (insertUserError || !insertedUserMessage) {
    console.error('Failed to save user message', insertUserError);
    const response = NextResponse.json(
      { error: 'Failed to save your message.' },
      { status: 500 }
    );
    ensureSessionCookie(response, sessionId);
    return response;
  }

  const { data: recentHistory, error: historyError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY);

  if (historyError) {
    console.error('Failed to fetch history for Gemini', historyError);
    const response = NextResponse.json(
      { error: 'Failed to fetch chat history for processing.' },
      { status: 500 }
    );
    ensureSessionCookie(response, sessionId);
    return response;
  }

  const orderedHistory = (recentHistory || []).sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );

  let assistantText = '';
  try {
    assistantText = await generateGeminiResponse(toGeminiMessages(orderedHistory));
  } catch (error) {
    console.error('Gemini generation failed', error);
    const response = NextResponse.json(
      { error: 'Sorry, I ran into an issue generating a reply.' },
      { status: 500 }
    );
    ensureSessionCookie(response, sessionId);
    return response;
  }

  const { data: insertedAssistantMessage, error: insertAssistantError } =
    await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: assistantText,
      })
      .select()
      .single();

  if (insertAssistantError || !insertedAssistantMessage) {
    console.error('Failed to save assistant message', insertAssistantError);
    const response = NextResponse.json(
      {
        error: 'Failed to save the assistant reply.',
        reply: assistantText,
      },
      { status: 500 }
    );
    ensureSessionCookie(response, sessionId);
    return response;
  }

  const response = NextResponse.json({
    sessionId,
    messages: [insertedUserMessage, insertedAssistantMessage],
    reply: assistantText,
  });
  ensureSessionCookie(response, sessionId);
  return response;
}

