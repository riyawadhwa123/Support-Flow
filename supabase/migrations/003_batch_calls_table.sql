-- Create batch_calls table to track batch calling jobs
CREATE TABLE batch_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  agent_id VARCHAR(255) NOT NULL,
  phone_number_id VARCHAR(255),
  total_calls_dispatched INTEGER DEFAULT 0,
  total_calls_scheduled INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_time_unix INTEGER,
  created_at_unix INTEGER NOT NULL,
  last_updated_at_unix INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create batch_call_recipients table to track individual recipients
CREATE TABLE batch_call_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_call_id UUID REFERENCES batch_calls(id) ON DELETE CASCADE,
  recipient_id VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  conversation_id VARCHAR(255),
  dynamic_variables JSONB,
  created_at_unix INTEGER NOT NULL,
  updated_at_unix INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_batch_calls_user_id ON batch_calls(user_id);
CREATE INDEX idx_batch_calls_status ON batch_calls(status);
CREATE INDEX idx_batch_calls_created_at ON batch_calls(created_at DESC);
CREATE INDEX idx_batch_call_recipients_batch_call_id ON batch_call_recipients(batch_call_id);
CREATE INDEX idx_batch_call_recipients_status ON batch_call_recipients(status);

-- Row Level Security (RLS) Policies
ALTER TABLE batch_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_call_recipients ENABLE ROW LEVEL SECURITY;

-- Batch calls policies
CREATE POLICY "Users can view their own batch calls" ON batch_calls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batch calls" ON batch_calls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batch calls" ON batch_calls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batch calls" ON batch_calls
  FOR DELETE USING (auth.uid() = user_id);

-- Batch call recipients policies
CREATE POLICY "Users can view recipients of their batch calls" ON batch_call_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM batch_calls
      WHERE batch_calls.id = batch_call_recipients.batch_call_id
      AND batch_calls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage recipients of their batch calls" ON batch_call_recipients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM batch_calls
      WHERE batch_calls.id = batch_call_recipients.batch_call_id
      AND batch_calls.user_id = auth.uid()
    )
  );

