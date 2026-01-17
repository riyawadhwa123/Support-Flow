import { NextResponse } from 'next/server';
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');

        const twiml = new VoiceResponse();

        if (!agentId) {
            twiml.say('Hello. No agent has been assigned to this number. Please configure it in the dashboard.');
        } else {
            // Connect to ElevenLabs Agent
            // Note: This requires the ElevenLabs Twilio integration or a similar setup.
            // For now, we'll use a <Connect><Stream> or <Connect><Conversation> depending on the integration type.
            // Assuming standard ElevenLabs Conversational AI integration via WebSocket or SIP.

            // Since the user asked to "connect the agents part", and we are using ElevenLabs JS SDK in other places,
            // we might need to use <Connect><Stream url="wss://api.elevenlabs.io/v1/convai/conversation?agent_id={agentId}" />
            // BUT ElevenLabs usually provides a specific SIP URI or WebSocket URL.

            // Let's assume we use the WebSocket stream for now as it's common for AI agents.
            const connect = twiml.connect();
            const stream = connect.stream({
                url: `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`,
            });

            // Add parameters if needed
            // stream.parameter({ name: 'agentId', value: agentId });
        }

        return new NextResponse(twiml.toString(), {
            headers: {
                'Content-Type': 'text/xml',
            },
        });
    } catch (error: any) {
        console.error('Error in Twilio webhook:', error);
        const twiml = new VoiceResponse();
        twiml.say('An error occurred while connecting the call.');
        return new NextResponse(twiml.toString(), {
            headers: {
                'Content-Type': 'text/xml',
            },
        });
    }
}
