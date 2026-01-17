import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/elevenlabs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getAgent(id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}
