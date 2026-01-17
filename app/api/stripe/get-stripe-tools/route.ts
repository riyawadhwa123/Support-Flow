import { NextRequest, NextResponse } from 'next/server';
import { StripeAgentToolkit } from '@stripe/agent-toolkit/openai';

// Add CORS headers for ElevenLabs webhook calls
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize Stripe Agent Toolkit with refund + capture + read capabilities
    const stripeAgentToolkit = new StripeAgentToolkit({
      secretKey,
      configuration: {
        actions: {
          refunds: {
            create: true,
            read: true,
          },
          customers: {
            read: true,
          },
          paymentIntents: {
            read: true,
            update: true,
          },
        },
      },
    });

    // Get available tools
    const tools = stripeAgentToolkit.getTools();

    // Format tools for ElevenLabs server tools format
    const formattedTools = tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));

    // Manually expose capture helper to keep UI parity with custom handler
    formattedTools.push({
      name: 'capture_payment_intent',
      description: 'Capture an uncaptured payment intent. Parameters: payment_intent_id (required), amount (optional, cents).',
      parameters: {
        type: 'object',
        properties: {
          payment_intent_id: { type: 'string', description: 'Payment intent ID (starts with pi_)' },
          amount: { type: 'integer', description: 'Amount to capture in cents (optional, defaults to full capturable amount)' },
        },
        required: ['payment_intent_id'],
      },
    });

    return NextResponse.json({ tools: formattedTools }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error getting Stripe tools:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get Stripe tools' },
      { status: 500, headers: corsHeaders }
    );
  }
}

