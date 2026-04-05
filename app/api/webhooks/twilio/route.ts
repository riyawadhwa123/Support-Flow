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
            // Connect to ElevenLabs Conversational AI Agent
            // Using the direct stream connection to ElevenLabs
            // The agent_id parameter tells ElevenLabs which agent to route the call to
            const connect = twiml.connect();
            connect.stream({
                url: `wss://api.elevenlabs.io/convai/stream/call?agent_id=${agentId}`,
            });
        }

        return new NextResponse(twiml.toString(), {
            headers: {
                'Content-Type': 'text/xml',
            },
        });
    } catch (error: any) {
        console.error('Error in Twilio webhook:', error);
        const twiml = new VoiceResponse();
        twiml.say('An error occurred while connecting the call. Please try again later.');
        return new NextResponse(twiml.toString(), {
            headers: {
                'Content-Type': 'text/xml',
            },
        });
    }
}
