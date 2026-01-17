-- Chat messages for the public chatbot (session-scoped)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast session history reads
CREATE INDEX idx_chat_messages_session_created ON chat_messages(session_id, created_at DESC);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Enable RLS and allow public/anon usage
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read chat messages by session" ON chat_messages
  FOR SELECT
  USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY "Anon can insert chat messages" ON chat_messages
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

