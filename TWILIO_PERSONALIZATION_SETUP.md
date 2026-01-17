# Twilio Personalization Setup Guide

This guide shows you how to set up caller identification and personalized greetings using ElevenLabs' Twilio personalization feature.

Based on: [ElevenLabs Twilio Personalization Docs](https://elevenlabs.io/docs/agents-platform/customization/personalization/twilio-personalization)

---

## Overview

When a customer calls your ElevenLabs agent:
1. ElevenLabs calls your webhook with caller info (`caller_id`, `agent_id`, etc.)
2. Your webhook looks up the caller in your database
3. Your webhook returns personalized data (name, account status, etc.)
4. Agent greets them by name: *"Hi Ryan! Thank you for calling. How can I help you today?"*

---

## Architecture

```
Incoming Call → ElevenLabs Platform
    ↓
    ↓ Webhook POST
    ↓
Your API: /api/elevenlabs/twilio-personalization
    ↓
    ↓ Look up phone number
    ↓
Supabase: customers table
    ↓
    ↓ Customer found?
    ↓
Return dynamic_variables:
  - customer_name: "Ryan Johnson"
  - account_status: "premium"
  - customer_tier: "gold"
    ↓
    ↓ conversation_config_override
    ↓
Agent: "Hi Ryan! Thank you for calling..."
```

---

## Step 1: Set Up Database (5 minutes)

### A. Run Migration

The migration creates a `customers` table with sample data.

**Option 1: Using Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/qigrmjvoixqsoohsuhti/editor
2. Click "SQL Editor" → "New Query"
3. Copy contents of `supabase/migrations/002_customers_table.sql`
4. Click "Run"

**Option 2: Using Supabase CLI** (if installed)
```bash
supabase db push
```

### B. Verify Table Created

1. Go to Supabase Dashboard → Table Editor
2. You should see a new `customers` table
3. It should have 3 sample customers

### C. Add Your Phone Number

Use the helper script:

```bash
# Add yourself as a customer
npm run add:customer "+12545365989" "Ryan Johnson" "ryan@gmail.com" "premium" "gold"

# List all customers
npm run add:customer list
```

**Important:** Use your actual phone number that you'll be calling from!

---

## Step 2: Configure ElevenLabs Webhook (3 minutes)

### A. Go to ElevenLabs Settings

1. Navigate to: https://elevenlabs.io/app/agents/settings
2. Scroll to "Webhooks" section

### B. Add Webhook URL

1. Click "Add Webhook"
2. Enter:
   - **Name:** `Twilio Personalization`
   - **URL:** `https://mythopoeic-toxicologically-lorinda.ngrok-free.dev/api/elevenlabs/twilio-personalization`
   - **Method:** POST
3. Click "Save"

### C. (Optional) Add Authentication

If you want to secure your webhook:
1. Click on the webhook you just created
2. Add a secret header:
   - **Header Name:** `x-webhook-secret`
   - **Secret Value:** Generate a random string (e.g., `my-secret-key-12345`)
3. Save the secret in ElevenLabs Secrets Manager
4. Update your API route to validate this header

---

## Step 3: Enable Personalization for Your Agent (2 minutes)

### A. Go to Agent Settings

1. Navigate to: https://elevenlabs.io/app/agents/agents/
2. Click on your "Support agent"

### B. Enable Personalization

1. Click on "Security" tab (or "Advanced" tab)
2. Find "Conversation Initiation Data"
3. Enable: **"Fetch conversation initiation data for inbound Twilio calls"**
4. Click "Save"

### C. Define Dynamic Variables

In your agent's configuration, add these dynamic variables:
- `customer_name`
- `customer_email`
- `account_status`
- `last_interaction`
- `customer_tier`

You can reference these in your system prompt like:
```
You are speaking with {{customer_name}}, a {{account_status}} customer.
Their tier is {{customer_tier}}.
```

---

## Step 4: Test the Personalization (2 minutes)

### A. Test the Webhook Endpoint

```bash
# PowerShell
Invoke-WebRequest -Uri "https://mythopoeic-toxicologically-lorinda.ngrok-free.dev/api/elevenlabs/twilio-personalization" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"caller_id":"+12545365989","agent_id":"test","called_number":"+1234567890","call_sid":"test123"}'
```

**Expected Response:**
```json
{
  "type": "conversation_initiation_client_data",
  "dynamic_variables": {
    "customer_name": "Ryan Johnson",
    "customer_email": "ryan@gmail.com",
    "account_status": "premium",
    "customer_tier": "gold"
  },
  "conversation_config_override": {
    "agent": {
      "prompt": {
        "prompt": "You are speaking with Ryan Johnson, a valued premium customer..."
      },
      "first_message": "Hi Ryan Johnson! Thank you for calling. How can I help you today?"
    }
  }
}
```

### B. Make a Test Call

1. Call your Twilio number (linked to the agent)
2. Listen for personalized greeting:
   - **If you're in the database:** *"Hi Ryan! Thank you for calling..."*
   - **If you're NOT in database:** *"Hi! Thank you for calling..."*

---

## Customization Options

### Dynamic Variables Available

The webhook provides these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `customer_name` | Customer's name | "Ryan Johnson" |
| `customer_email` | Email address | "ryan@gmail.com" |
| `account_status` | Account status | "premium", "active" |
| `last_interaction` | Last call date | "12/9/2024" |
| `customer_tier` | Membership tier | "gold", "silver", "platinum" |

### Conversation Overrides

You can dynamically override:
- **System prompt** - Personalize based on customer history
- **First message** - Greet by name
- **Language** - Use customer's preferred language
- **Voice** - Switch to a different voice per customer

### Example: VIP Customer

```typescript
if (customer.account_status === 'premium') {
  response.conversation_config_override.agent.prompt.prompt += `
    This is a VIP customer. Prioritize their request and offer premium support options.
  `;
}
```

---

## Managing Customers

### Add a New Customer

```bash
npm run add:customer "+11234567890" "Sarah Smith" "sarah@example.com" "active" "silver"
```

### List All Customers

```bash
npm run add:customer list
```

### Update a Customer

Run the add command with the same phone number to update:

```bash
npm run add:customer "+11234567890" "Sarah Smith-Jones" "sarah.new@example.com" "premium" "gold"
```

### Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/qigrmjvoixqsoohsuhti/editor
2. Select `customers` table
3. Click "Insert" → "Insert row"
4. Or edit existing rows directly

---

## Troubleshooting

### Issue: Agent doesn't greet by name

**Check:**
1. Webhook is called? Check Next.js dev server logs
2. Customer exists in database? Run `npm run add:customer list`
3. Phone number format matches? Use E.164 format: `+12545365989`
4. Webhook URL correct in ElevenLabs settings?
5. Personalization enabled in agent's Security tab?

**Debug:**
```bash
# Check dev server logs
Get-Content "c:\Users\anmol\.cursor\projects\d-Downloads-new-supportflow-new-main\terminals\2.txt" | Select-Object -Last 30
```

Look for:
```
Twilio personalization webhook called: { caller_id: '+12545365989', ... }
Customer found: Ryan Johnson
```

### Issue: Webhook timeout

**Solution:** The webhook should respond in <2 seconds. Check:
- Database query is fast (indexed on `phone_number`)
- Network connectivity to Supabase
- No blocking operations in the webhook

### Issue: Getting "valued customer" instead of name

**Cause:** Customer not found in database

**Solution:**
1. Check phone number format (must match exactly)
2. Add customer: `npm run add:customer "+12545365989" "Your Name"`

---

## Security Best Practices

### 1. Validate Webhook Signatures

Add header validation in your webhook:

```typescript
const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;
const signature = request.headers.get('x-webhook-secret');

if (signature !== webhookSecret) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 2. Use HTTPS Only

- ✅ ngrok provides HTTPS
- ✅ Production deployment should use HTTPS
- ❌ Never use HTTP in production

### 3. Store Secrets Properly

- Store webhook secrets in ElevenLabs Secrets Manager
- Store API keys in `.env.local` (never commit)
- Use Supabase RLS for database security

### 4. Rate Limiting

Consider adding rate limiting for webhook endpoints:

```typescript
// In middleware or webhook route
const ip = request.headers.get('x-forwarded-for');
// Implement rate limiting logic
```

---

## Advanced: Custom Metadata

Store custom data in the `metadata` JSONB field:

```javascript
await supabase.from('customers').insert({
  phone_number: '+11234567890',
  name: 'Sarah Smith',
  metadata: {
    tier: 'gold',
    preferred_language: 'es',
    support_priority: 'high',
    account_manager: 'John Doe',
    last_purchase: '2024-12-01',
    lifetime_value: 5000
  }
});
```

Use in webhook:

```typescript
const response = {
  dynamic_variables: {
    customer_name: customer.name,
    support_priority: customer.metadata.support_priority,
    account_manager: customer.metadata.account_manager,
  },
  conversation_config_override: {
    agent: {
      prompt: {
        prompt: `Priority: ${customer.metadata.support_priority}. 
                 Account Manager: ${customer.metadata.account_manager}.`
      },
      language: customer.metadata.preferred_language || 'en'
    }
  }
};
```

---

## Files Created

1. **`supabase/migrations/002_customers_table.sql`** - Database schema
2. **`app/api/elevenlabs/twilio-personalization/route.ts`** - Webhook endpoint
3. **`scripts/add-customer.js`** - Customer management script
4. **`TWILIO_PERSONALIZATION_SETUP.md`** - This guide

## Files Modified

1. **`middleware.ts`** - Allow public access to webhook
2. **`package.json`** - Added `add:customer` script

---

## Next Steps

1. ✅ Run database migration
2. ✅ Add your phone number to customers table
3. ✅ Configure webhook URL in ElevenLabs settings
4. ✅ Enable personalization in agent settings
5. ✅ Test with a phone call
6. ✅ Add more customers as needed
7. ✅ Customize dynamic variables and prompts
8. ✅ Set up authentication (optional)

---

## Support

If you encounter issues:
1. Check Next.js dev server logs for webhook calls
2. Verify customer exists: `npm run add:customer list`
3. Test webhook directly with curl/PowerShell
4. Check ElevenLabs dashboard for webhook errors
5. Ensure ngrok is running and URL is correct

Your personalized greeting system is now ready! 🎉

