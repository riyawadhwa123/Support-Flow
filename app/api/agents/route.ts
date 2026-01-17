import { NextResponse } from 'next/server';
import { listAgents, createAgent } from '@/lib/elevenlabs';

export async function GET() {
  try {
    const data = await listAgents();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await createAgent(body);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create agent' },
      { status: 500 }
    );
  }
}




