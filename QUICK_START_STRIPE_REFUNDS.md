# Quick Start: Stripe Automated Refunds

## What Was Set Up

✅ **Stripe Agent Toolkit Integration**
- Installed `@stripe/agent-toolkit` package
- Created API endpoints for Stripe tool access
- Built custom refund handler with customer/order identification

## API Endpoints Created

### 1. `/api/stripe/get-stripe-tools`
Returns available Stripe tools for your agent.

### 2. `/api/stripe/call-stripe-tool`
Executes Stripe operations, including refunds with smart customer/order identification.

## How to Configure Your Agent

### Step 1: Add Server Tools to Your ElevenLabs Agent

When creating or updating an agent via the ElevenLabs API or dashboard, add these server tools:

```json
{
  "server_tools": [
    {
      "name": "getStripeTools",
      "description": "Get available Stripe tools and their parameters",
      "url": "https://your-domain.com/api/stripe/get-stripe-tools"
    },
    {
      "name": "callStripeTool",
      "description": "Call a Stripe tool to perform operations like creating refunds, retrieving customer information, or searching for payments",
      "url": "https://your-domain.com/api/stripe/call-stripe-tool"
    }
  ]
}
```

### Step 2: Update Agent System Prompt

Add refund processing instructions to your agent's system prompt. You can use the helper:

```typescript
import { getStripeAgentSystemPrompt } from '@/lib/stripe-agent-config';

// Use in your agent configuration
const systemPrompt = getStripeAgentSystemPrompt();
```

Or manually add the refund instructions (see `STRIPE_REFUND_SETUP.md` for full prompt).

## How It Works

1. **Customer Requests Refund**: Agent asks for customer ID, email, or order number
2. **Identification**: System finds the customer and their payment using:
   - Customer ID (`cus_xxx`)
   - Email address
   - Order number (from payment metadata)
   - Payment Intent ID (`pi_xxx`)
   - Charge ID (`ch_xxx`)
3. **Refund Processing**: System processes the refund through Stripe
4. **Confirmation**: Agent confirms the refund with the customer

## Example Agent Conversation Flow

**Customer**: "I want a refund for my order"

**Agent**: "I'd be happy to help you with a refund. Could you please provide your order number, customer ID, or email address?"

**Customer**: "My email is customer@example.com"

**Agent**: [Calls `callStripeTool` with customerIdentifier]
"Thank you! I found your payment. Would you like a full refund or a partial refund?"

**Customer**: "Full refund please"

**Agent**: [Processes refund]
"Perfect! I've processed your full refund. The amount will appear on your statement within 5-10 business days. Is there anything else I can help you with?"

## Testing

Test the refund API directly:

```bash
# Get available tools
curl http://localhost:3000/api/stripe/get-stripe-tools

# Test refund by customer email
curl -X POST http://localhost:3000/api/stripe/call-stripe-tool \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "refunds_create",
    "parameters": {
      "customerIdentifier": "customer@example.com",
      "reason": "requested_by_customer"
    }
  }'
```

## Files Created

- `lib/stripe.ts` - Stripe client and helper functions
- `lib/stripe-agent-config.ts` - Agent configuration helpers
- `app/api/stripe/get-stripe-tools/route.ts` - Get available tools endpoint
- `app/api/stripe/call-stripe-tool/route.ts` - Execute Stripe tools endpoint
- `STRIPE_REFUND_SETUP.md` - Detailed documentation

## Next Steps

1. Configure your agent with the server tools URLs
2. Update your agent's system prompt with refund instructions
3. Test with a real customer scenario
4. Monitor refunds in your Stripe dashboard

## Important Notes

- Ensure `STRIPE_SECRET_KEY` is set in your `.env.local`
- All refunds are processed with reason "requested_by_customer"
- The system automatically finds the most recent charge if multiple charges exist
- Partial refunds require specifying the amount in cents

