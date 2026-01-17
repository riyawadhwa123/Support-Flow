import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Agent = {
  id: string;
  name: string;
  system_prompt: string;
  voice_id: string;
  first_message: string;
  language: string;
  llm_model: string;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type KnowledgeBase = {
  id: string;
  document_id: string;
  name: string;
  file_url: string;
  file_size: number;
  agent_id: string;
  created_at: string;
};

export type Voice = {
  id: string;
  voice_id: string;
  name: string;
  category: string;
  language: string;
  preview_url: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  conversation_id: string;
  agent_id: string;
  duration: number;
  status: string;
  phone_number: string;
  created_at: string;
};

export type PhoneNumber = {
  id: string;
  phone_number: string;
  agent_id: string;
  twilio_sid: string;
  created_at: string;
};

