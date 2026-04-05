import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.elevenlabs.io/v1/convai/phone-numbers', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to fetch phone numbers', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching phone numbers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { phone_number, label, sid, supports_inbound, supports_outbound } = body;

    if (!phone_number || !label || !sid) {
      return NextResponse.json(
        { error: 'Missing required fields: phone_number, label, and sid are required' },
        { status: 400 }
      );
    }

    // Get Twilio token from environment variables
    // In production, this should be retrieved from workspace settings based on SID
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!token) {
      console.error('[Phone Import] ERROR: TWILIO_AUTH_TOKEN is missing!');
      return NextResponse.json(
        { error: 'Twilio token not configured. Please set TWILIO_AUTH_TOKEN in environment variables or workspace settings.' },
        { status: 500 }
      );
    }

    // 🔍 DEBUG LOGS
    console.log('[Phone Import] Starting import...');
    console.log('[Phone Import] Phone Number:', phone_number);
    console.log('[Phone Import] Label:', label);
    console.log('[Phone Import] SID:', sid);
    console.log('[Phone Import] Token (first 10 chars):', token.substring(0, 10) + '...');
    console.log('[Phone Import] Token length:', token.length);
    console.log('[Phone Import] Sending to ElevenLabs API...');

    const requestBody: any = {
      phone_number,
      label,
      sid,
      token,
      provider: 'twilio',
    };

    if (supports_inbound !== undefined) {
      requestBody.supports_inbound = supports_inbound;
    }
    if (supports_outbound !== undefined) {
      requestBody.supports_outbound = supports_outbound;
    }

    const response = await fetch('https://api.elevenlabs.io/v1/convai/phone-numbers', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Phone Import] ElevenLabs Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Phone Import] ERROR Response from ElevenLabs:', errorData);
      return NextResponse.json(
        { error: 'Failed to import phone number', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Phone Import] SUCCESS! Phone number imported:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Phone Import] Exception error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
