/**
 * Helper functions and configurations for Stripe Agent Toolkit integration
 */

export interface StripeToolConfig {
  serverTools: Array<{
    name: string;
    description: string;
    url: string;
  }>;
}

/**
 * Get Stripe server tools configuration for ElevenLabs agents
 */
export function getStripeServerToolsConfig(baseUrl: string = ''): StripeToolConfig {
  // Use environment variable, then provided baseUrl, then window location
  const apiBase = 
    process.env.NEXT_PUBLIC_API_BASE_URL || 
    baseUrl || 
    (typeof window !== 'undefined' ? window.location.origin : '');

  return {
    serverTools: [
      {
        name: 'getStripeTools',
        description: 'Get available Stripe tools and their parameters. Use this to see what Stripe operations are available.',
        url: `${apiBase}/api/stripe/get-stripe-tools`,
      },
      {
        name: 'callStripeTool',
        description: 'Call a Stripe tool to perform operations like creating refunds, retrieving customer information, or searching for payments. When processing refunds, you can identify customers by their customer ID (starts with cus_), email, or by order number/payment intent ID.',
        url: `${apiBase}/api/stripe/call-stripe-tool`,
      },
    ],
  };
}

/**
 * Get Stripe server tools array for direct use in agent configuration
 */
export function getStripeServerTools(baseUrl: string = ''): Array<{
  name: string;
  description: string;
  url: string;
}> {
  const config = getStripeServerToolsConfig(baseUrl);
  return config.serverTools;
}

/**
 * Get system prompt instructions for refund processing
 */
export function getRefundInstructions(): string {
  return `
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
   - Use the \`callStripeTool\` with tool name "get_customer_payments" or search for the payment using the identifier provided
   - Confirm the payment details with the customer before processing

3. **Process the Refund:**
   - Use \`callStripeTool\` with the following parameters:
     - toolName: "refunds_create" or "create_refund"
     - parameters: {
         - customerIdentifier: (customer ID or email) OR
         - orderIdentifier: (order number, payment intent ID, or charge ID) OR
         - charge_id: (direct charge ID if available)
         - amount: (optional, in cents - if not provided, full refund)
         - reason: "requested_by_customer"
         - metadata: { "processed_by": "ai_agent", "reason": "customer_request" }
       }

4. **Confirm the Refund:**
   - After processing, confirm the refund amount and status with the customer
   - Let them know the refund will appear on their statement within 5-10 business days

**Important Notes:**
- Always verify customer identity before processing refunds
- If the customer provides an order number, use orderIdentifier parameter
- If the customer provides customer ID or email, use customerIdentifier parameter
- Partial refunds require specifying the amount in cents
- Full refunds can be processed without specifying amount
`;
}

/**
 * Get complete system prompt for agent with Stripe refund capabilities
 */
export function getStripeAgentSystemPrompt(): string {
  return `
You are a customer service agent with access to Stripe payment processing tools.

${getRefundInstructions()}

## Available Stripe Tools

You have access to the following server tools:
- \`getStripeTools\`: Get list of available Stripe operations
- \`callStripeTool\`: Execute Stripe operations (refunds, customer lookup, payment search, etc.)

## Workflow for Refund Requests

1. Greet the customer and ask how you can help
2. If they request a refund:
   a. Ask for their customer ID, email, or order number
   b. Verify the payment details
   c. Confirm the refund amount (full or partial)
   d. Process the refund using callStripeTool
   e. Confirm the refund was successful
3. Be professional, empathetic, and clear in all communications
4. Keep responses concise and friendly for voice interactions
`;
}

