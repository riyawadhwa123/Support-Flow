import { NextRequest, NextResponse } from 'next/server';
import { updateTool, deleteTool, type ToolConfig } from '@/lib/elevenlabs-tools';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tool_config } = body;

    if (!tool_config) {
      return NextResponse.json(
        { error: 'tool_config is required' },
        { status: 400 }
      );
    }

    const data = await updateTool(id, tool_config as ToolConfig);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tool' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteTool(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tool' },
      { status: 500 }
    );
  }
}

