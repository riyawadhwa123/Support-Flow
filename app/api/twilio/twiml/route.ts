import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[/api/twilio/twiml] Incoming call received');

    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agent_id');

    if (!agentId) {
      console.error('[/api/twilio/twiml] Missing agent_id parameter');
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Agent ID is required</Say>
  <Hangup/>
</Response>`;
      return new NextResponse(errorTwiml, {
        status: 400,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    console.log(`[/api/twilio/twiml] Agent ID: ${agentId}`);

    // Use production domain
    const appUrl = 'https://supportflow-orcin.vercel.app';
    const handleInputUrl = `${appUrl}/api/twilio/handle-input`;

    // TwiML with Gather block to collect key presses
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${handleInputUrl}" method="POST">
    <Say>Press any key</Say>
  </Gather>
  <Say>Goodbye</Say>
</Response>`;

    console.log('[/api/twilio/twiml] Sending TwiML with Gather block');

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('[/api/twilio/twiml] Error:', error);

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>An error occurred</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
