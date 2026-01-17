const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

export type GeminiMessage = {
  role: 'user' | 'assistant';
  content: string;
  imageBase64?: string;
  imageMimeType?: string;
};

const SYSTEM_PROMPT = `
You are SupportFlow AI, a helpful assistant with full knowledge of the company's products, services, and policies.
Always provide concise, action-oriented answers. If you are unsure, say so and explain how you would verify.
When images are provided, describe what you see and incorporate that into your answer.
`.trim();

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
] as const;

function toParts(message: GeminiMessage) {
  const parts: any[] = [];

  if (message.content?.trim()) {
    parts.push({ text: message.content.trim() });
  }

  if (message.imageBase64) {
    parts.push({
      inlineData: {
        data: message.imageBase64,
        mimeType: message.imageMimeType || 'image/png',
      },
    });
  }

  return parts;
}

export async function generateGeminiResponse(messages: GeminiMessage[]) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const contents = [
    {
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT }],
    },
    ...messages
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: toParts(message),
      }))
      .filter((entry) => entry.parts.length > 0),
  ];

  const body = {
    contents,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.4,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${errorText}`);
  }

  const result = (await response.json()) as any;
  const parts = result?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts
        .map((part: any) => part?.text)
        .filter(Boolean)
        .join('\n')
        .trim()
    : '';

  if (!text) {
    throw new Error('Gemini returned no content');
  }

  return text;
}

