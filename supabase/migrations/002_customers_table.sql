-- Create customers table for Twilio personalization
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  account_status VARCHAR(50) DEFAULT 'active',
  last_interaction TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast phone number lookups
CREATE INDEX idx_customers_phone_number ON customers(phone_number);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all customers (for webhook endpoint)
CREATE POLICY "Service role can manage all customers" ON customers
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view customers
CREATE POLICY "Authenticated users can view customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert some sample customers for testing
INSERT INTO customers (phone_number, name, email, account_status, metadata) VALUES
  ('+12545365989', 'Ryan Johnson', 'ryan@gmail.com', 'premium', '{"preferred_language": "en", "tier": "gold"}'),
  ('+11234567890', 'Sarah Smith', 'sarah@example.com', 'active', '{"preferred_language": "en", "tier": "silver"}'),
  ('+917906632174', 'Mike Brown', 'mike@example.com', 'premium', '{"preferred_language": "en", "tier": "platinum"}');

