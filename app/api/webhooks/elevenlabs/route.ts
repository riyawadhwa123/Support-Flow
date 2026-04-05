import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    // Get the signature from headers
    const signature = request.headers.get('elevenlabs-signature') || '';
    const body = await request.text();

    // Verify HMAC signature
    if (WEBHOOK_SECRET) {
      const hash = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (hash !== signature) {
        console.warn('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse the webhook payload
    const data = JSON.parse(body);

    console.log('ElevenLabs Webhook Received:', {
      event: data.event_type,
      conversationId: data.conversation_id,
      agentId: data.agent_id,
      timestamp: new Date().toISOString(),
    });

    // Handle different event types
    switch (data.event_type) {
      case 'conversation_started':
        console.log('Conversation started:', data.conversation_id);
        break;

      case 'conversation_ended':
        console.log('Conversation ended:', data.conversation_id);
        // You can store call summary here
        break;

      case 'message':
        console.log('Message received:', data.message);
        break;

      default:
        console.log('Unknown event type:', data.event_type);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
