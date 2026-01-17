import { NextRequest, NextResponse } from 'next/server';
import { calculateLlmUsage } from '@/lib/elevenlabs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await calculateLlmUsage(id, body);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error calculating LLM usage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate LLM usage' },
      { status: 500 }
    );
  }
}




