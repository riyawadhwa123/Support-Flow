# Stripe Automated Refunds Setup Guide

This guide explains how to set up automated refunds using Stripe Agent Toolkit with your ElevenLabs conversational agents.

## Overview

The system allows your AI agents to process refunds automatically when customers request them. The agent will:
1. Ask the customer for their user ID, email, or order number
2. Identify the customer and their payment
3. Process the refund through Stripe

## API Endpoints

### 1. Get Stripe Tools
**Endpoint:** `GET /api/stripe/get-stripe-tools`

Returns the list of available Stripe tools that can be used by the agent.

**Response:**
```json
{
  "tools": [
    {
      "name": "stripe_refunds_create",
      "description": "Create a refund for a charge",
      "parameters": { ... }
    }
  ]
}
```

### 2. Call Stripe Tool
**Endpoint:** `POST /api/stripe/call-stripe-tool`

Executes a Stripe operation. For refunds, supports multiple identification methods.

**Request Body:**
```json
{
  "toolName": "refunds_create",
  "parameters": {
    "customerIdentifier": "cus_xxx" or "customer@email.com",
    "orderIdentifier": "order_123" or "pi_xxx" or "ch_xxx",
    "charge_id": "ch_xxx",
    "payment_intent_id": "pi_xxx",
    "amount": 1000,  // Optional: amount in cents (full refund if omitted)
    "reason": "requested_by_customer",
    "metadata": {}
  }
}
```

## Agent Configuration

To enable refund processing in your ElevenLabs agent, you need to:

### 1. Add Server Tools to Agent

When creating or updating an agent, configure server tools in the agent's conversation configuration. The server tools should point to:

- **getStripeTools**: `https://your-domain.com/api/stripe/get-stripe-tools`
- **callStripeTool**: `https://your-domain.com/api/stripe/call-stripe-tool`

### 2. Update System Prompt

Add refund processing instructions to your agent's system prompt. You can use the helper function:

```typescript
import { getStripeAgentSystemPrompt } from '@/lib/stripe-agent-config';

const systemPrompt = getStripeAgentSystemPrompt();
```

Or manually add:

```
You are a customer service agent with access to Stripe payment processing tools.

## Refund Processing Guidelines

When a customer requests a refund:

1. **Identify the Customer or Order:**
   - Ask the customer for their:
     - Customer ID (if they have it, starts with "cus_")
     - Email address
     - Order number
     - Payment intent ID (starts with "pi_")
     - Charge ID (starts with "ch_")

2. **Verify the Payment:**
   - Use the `callStripeTool` to search for the payment using the identifier provided
   - Confirm the payment details with the customer before processing

3. **Process the Refund:**
   - Use `callStripeTool` with toolName "refunds_create" and parameters:
     - customerIdentifier: (customer ID or email) OR
     - orderIdentifier: (order number, payment intent ID, or charge ID) OR
     - charge_id: (direct charge ID if available)
     - amount: (optional, in cents - if not provided, full refund)
     - reason: "requested_by_customer"

4. **Confirm the Refund:**
   - After processing, confirm the refund amount and status with the customer
   - Let them know the refund will appear on their statement within 5-10 business days
```

## Usage Examples

### Example 1: Refund by Customer Email

```json
POST /api/stripe/call-stripe-tool
{
  "toolName": "refunds_create",
  "parameters": {
    "customerIdentifier": "customer@example.com",
    "reason": "requested_by_customer"
  }
}
```

### Example 2: Refund by Order Number

```json
POST /api/stripe/call-stripe-tool
{
  "toolName": "refunds_create",
  "parameters": {
    "orderIdentifier": "ORDER-12345",
    "amount": 5000,
    "reason": "requested_by_customer"
  }
}
```

### Example 3: Refund by Charge ID

```json
POST /api/stripe/call-stripe-tool
{
  "toolName": "refunds_create",
  "parameters": {
    "charge_id": "ch_1234567890",
    "reason": "requested_by_customer"
  }
}
```

## Customer Identification Methods

The system supports multiple ways to identify customers and payments:

1. **Customer ID** (`cus_xxx`): Direct Stripe customer ID
2. **Email**: Customer email address (searches Stripe customers)
3. **Order Number**: Custom order number stored in payment metadata
4. **Payment Intent ID** (`pi_xxx`): Stripe payment intent ID
5. **Charge ID** (`ch_xxx`): Direct Stripe charge ID

## Error Handling

The API returns appropriate error messages for:
- Missing customer/payment information
- Invalid identifiers
- Payment not found
- Refund processing failures

## Security Notes

- All API routes require `STRIPE_SECRET_KEY` to be configured
- Refunds are processed with reason "requested_by_customer" by default
- All refunds are logged with metadata for audit purposes
- Consider adding authentication/authorization for production use

## Testing

You can test the refund functionality using:

```bash
# Get available tools
curl http://localhost:3000/api/stripe/get-stripe-tools

# Test refund (replace with actual values)
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

