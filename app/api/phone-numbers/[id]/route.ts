import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const phoneNumberId = resolvedParams.id;
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`,
      {
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch phone number' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching phone number:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const phoneNumberId = resolvedParams.id;
    const body = await request.json();

    console.log('PATCH phone number request:', { phoneNumberId, body });

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`,
      {
        method: 'PATCH',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    console.log('ElevenLabs API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to update phone number', details: errorData },
        { status: response.status }
      );
    }

    // Handle empty response body (some APIs return 200 with no body)
    const contentType = response.headers.get('content-type');
    let data = {};
    
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.warn('Failed to parse response JSON:', text);
        }
      }
    }

    console.log('ElevenLabs API success response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating phone number:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const phoneNumberId = resolvedParams.id;
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`,
      {
        method: 'DELETE',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to delete phone number', details: errorData },
        { status: response.status }
      );
    }

    // ElevenLabs API may return empty body on successful delete
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting phone number:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

