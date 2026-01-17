import { NextResponse } from 'next/server';
import { listVoices } from '@/lib/elevenlabs';

export async function GET() {
  try {
    const data = await listVoices();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching voices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}




