-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  system_prompt TEXT,
  voice_id VARCHAR(255),
  first_message TEXT,
  language VARCHAR(50) DEFAULT 'en',
  llm_model VARCHAR(100) DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create knowledge_base table
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_url TEXT,
  file_size BIGINT DEFAULT 0,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voices table
CREATE TABLE voices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voice_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  language VARCHAR(50),
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id VARCHAR(255) UNIQUE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  duration INTEGER DEFAULT 0,
  status VARCHAR(50),
  phone_number VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create phone_numbers table
CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(50) UNIQUE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  twilio_sid VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_created_at ON agents(created_at DESC);
CREATE INDEX idx_knowledge_base_agent_id ON knowledge_base(agent_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_phone_numbers_agent_id ON phone_numbers(agent_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for agents table
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Agents policies
CREATE POLICY "Users can view their own agents" ON agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agents" ON agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" ON agents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents" ON agents
  FOR DELETE USING (auth.uid() = user_id);

-- Knowledge base policies
CREATE POLICY "Users can view knowledge base of their agents" ON knowledge_base
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = knowledge_base.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create knowledge base for their agents" ON knowledge_base
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = knowledge_base.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete knowledge base of their agents" ON knowledge_base
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = knowledge_base.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Voices policies (public read)
CREATE POLICY "Anyone can view voices" ON voices
  FOR SELECT USING (true);

-- Conversations policies
CREATE POLICY "Users can view conversations of their agents" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = conversations.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Phone numbers policies
CREATE POLICY "Users can view phone numbers of their agents" ON phone_numbers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = phone_numbers.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage phone numbers of their agents" ON phone_numbers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = phone_numbers.agent_id
      AND agents.user_id = auth.uid()
    )
  );

