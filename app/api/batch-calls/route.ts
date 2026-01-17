import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      call_name,
      agent_id,
      recipients,
      scheduled_time_unix,
      agent_phone_number_id 
    } = body;

    // Validate required fields
    if (!call_name || !agent_id || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Submit batch call to ElevenLabs
    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/convai/batch-calling/submit`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        call_name,
        agent_id,
        recipients,
        scheduled_time_unix,
        agent_phone_number_id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API error:', errorData);
      return NextResponse.json(
        { error: errorData.detail?.message || 'Failed to submit batch call' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Store batch call in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get user from request (you'll need to add authentication)
      // For now, we'll skip user association or use a default
      await supabase.from('batch_calls').insert({
        batch_id: data.id,
        name: data.name,
        agent_id: data.agent_id,
        phone_number_id: data.phone_number_id,
        total_calls_dispatched: data.total_calls_dispatched,
        total_calls_scheduled: data.total_calls_scheduled,
        status: data.status,
        scheduled_time_unix: data.scheduled_time_unix,
        created_at_unix: data.created_at_unix,
        last_updated_at_unix: data.last_updated_at_unix,
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error submitting batch call:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';
    const last_doc = searchParams.get('last_doc');

    // Build query params
    const params = new URLSearchParams();
    params.append('limit', limit);
    if (last_doc) {
      params.append('last_doc', last_doc);
    }

    // Fetch from ElevenLabs API
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/v1/convai/batch-calling/workspace?${params.toString()}`,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch batch calls' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching batch calls:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

