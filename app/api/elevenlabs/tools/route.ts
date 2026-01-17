import { NextRequest, NextResponse } from 'next/server';
import { listTools, createTool, type ToolConfig } from '@/lib/elevenlabs-tools';

export async function GET(request: NextRequest) {
  try {
    const data = await listTools();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error listing tools:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list tools' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool_config } = body;

    if (!tool_config) {
      return NextResponse.json(
        { error: 'tool_config is required' },
        { status: 400 }
      );
    }

    const data = await createTool(tool_config as ToolConfig);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tool' },
      { status: 500 }
    );
  }
}

