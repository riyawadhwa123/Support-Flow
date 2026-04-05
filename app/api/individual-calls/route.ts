import { NextRequest, NextResponse } from 'next/server';
import { twilioClient } from '@/lib/twilio';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      phone_number,
      agent_id,
      phone_number_id,
      name,
      language
    } = body;

    // Validate required fields
    if (!phone_number || !agent_id) {
      return NextResponse.json(
        { error: 'Missing required fields: phone_number, agent_id' },
        { status: 400 }
      );
    }

    // Generate the TwiML URL for this call
    // Use the app's public URL from env, or fallback to constructed URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('x-forwarded-host') || request.headers.get('host')}`;
    
    const twimlUrl = `${appUrl}/api/twilio/twiml?agent_id=${agent_id}`;

    // Make the call using Twilio with TwiML endpoint
    const call = await twilioClient.calls.create({
      to: phone_number,
      from: TWILIO_PHONE_NUMBER,
      url: twimlUrl,
    });

    return NextResponse.json({
      success: true,
      call_sid: call.sid,
      to: phone_number,
      from: TWILIO_PHONE_NUMBER,
      status: call.status,
      message: `Call initiated to ${phone_number}`,
    });
  } catch (error: any) {
    console.error('Error making individual call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate call' },
      { status: 500 }
    );
  }
}
