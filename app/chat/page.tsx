'use client';

import type { ChangeEvent, KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, X as CloseIcon } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string | null;
  image_url?: string | null;
  created_at?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function formatRole(role: Message['role']) {
  return role === 'user' ? 'You' : 'Assistant';
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border p-3 ${
        message.role === 'user' ? 'border-blue-200 bg-blue-50/70' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {formatRole(message.role)}
      </div>
      {message.content ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      ) : null}
      {message.image_url ? (
        <div className="overflow-hidden rounded-md border border-slate-200">
          <img
            src={message.image_url}
            alt="User attachment"
            className="max-h-64 w-full object-contain"
          />
        </div>
      ) : null}
      <div className="text-[11px] uppercase tracking-wide text-slate-400">
        {message.created_at
          ? new Date(message.created_at).toLocaleString()
          : 'Just now'}
      </div>
    </div>
  );
}

async function fileToBase64(file: File) {
  return new Promise<{ base64: string; mimeType: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const [, base64] = result.split(',');
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasMessages = useMemo(() => messages.length > 0, [messages]);

  useEffect(() => {
    const loadHistory = async () => {
      setIsHydrating(true);
      try {
        const response = await fetch('/api/chat', { method: 'GET' });
        if (!response.ok) {
          throw new Error('Failed to load chat history.');
        }
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error(err);
        setError('Unable to load chat right now. Please try again.');
      } finally {
        setIsHydrating(false);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 5MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetFile = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSend = async () => {
    setError(null);

    if (isLoading) return;

    const trimmed = input.trim();
    if (!trimmed && !imageFile) {
      setError('Please enter a message or attach an image.');
      return;
    }

    setIsLoading(true);
    const tempId = `temp-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        role: 'user',
        content: trimmed || null,
        image_url: imagePreview,
      },
    ]);

    try {
      const imagePayload = imageFile ? await fileToBase64(imageFile) : null;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          imageBase64: imagePayload?.base64,
          imageMimeType: imagePayload?.mimeType,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message.');
      }

      const data = await response.json();
      const newMessages: Message[] = data.messages || [];

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        ...newMessages,
      ]);
      setInput('');
      resetFile();
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(err?.message || 'Something went wrong while sending your message.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-4 py-8">
      <header className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Chat with SupportFlow</h1>
        <p className="text-sm text-slate-600">
          Ask anything about the company, products, or policies. Attach an image if it helps.
        </p>
      </header>

      <div className="flex-1 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {hasMessages ? (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        ) : (
          <div className="text-center text-sm text-slate-500">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="sticky bottom-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-md">
          {imagePreview ? (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
              />
              <div className="flex-1 text-xs text-slate-600">Image attached</div>
              <Button size="icon" variant="ghost" onClick={resetFile} aria-label="Remove image">
                <CloseIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach image"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Textarea
              placeholder="Type your message..."
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[52px] flex-1 resize-none rounded-xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-2 focus-visible:ring-slate-300"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || isHydrating}
              className="h-11 px-5"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{isHydrating ? 'Loading history…' : 'Chat is ready.'}</span>
            <span>JPG, PNG, or GIF · Max 5MB</span>
          </div>
          {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
        </div>
      </div>
    </div>
  );
}

