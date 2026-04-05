import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse form data (Twilio sends data as application/x-www-form-urlencoded)
    const formData = await request.text();
    const params = new URLSearchParams(formData);

    const digits = params.get('Digits') || 'none';
    const callSid = params.get('CallSid') || 'unknown';

    console.log(`[/api/twilio/handle-input] Received key press`);
    console.log(`[/api/twilio/handle-input] Digits: ${digits}`);
    console.log(`[/api/twilio/handle-input] CallSid: ${callSid}`);

    // Return TwiML confirming key receipt
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Key received successfully</Say>
</Response>`;

    console.log('[/api/twilio/handle-input] Sending confirmation TwiML');

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('[/api/twilio/handle-input] Error:', error);

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>An error occurred processing your key</Say>
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
