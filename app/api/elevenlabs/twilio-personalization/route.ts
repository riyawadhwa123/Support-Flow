import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// CORS headers for ElevenLabs webhook calls
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, xi-api-key',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Get Supabase service role client (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the incoming Twilio data from ElevenLabs
    const body = await request.json();
    const { caller_id, agent_id, called_number, call_sid } = body;

    console.log('Twilio personalization webhook called:', {
      caller_id,
      agent_id,
      called_number,
      call_sid,
    });

    // Look up customer by phone number
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', caller_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is OK
      console.error('Database error:', error);
    }

    // Prepare response data
    let response;

    if (customer) {
      // Customer found - personalize the conversation
      console.log('Customer found:', customer.name);
      
      // Extract first name from full name
      const firstName = customer.name.split(' ')[0];
      
      // Update last interaction
      await supabase
        .from('customers')
        .update({ last_interaction: new Date().toISOString() })
        .eq('id', customer.id);

      response = {
        type: 'conversation_initiation_client_data',
        dynamic_variables: {
          customer_name: customer.name,
          customer_first_name: firstName,
          customer_email: customer.email || 'Not provided',
          account_status: customer.account_status || 'active',
          last_interaction: customer.last_interaction
            ? new Date(customer.last_interaction).toLocaleDateString()
            : 'First time caller',
          customer_tier: customer.metadata?.tier || 'standard',
        },
        conversation_config_override: {
          agent: {
            prompt: {
              prompt: `You are speaking with ${customer.name}, a valued ${customer.account_status} customer. 
              Their email is ${customer.email || 'not on file'}. 
              ${customer.last_interaction ? `They last contacted us on ${new Date(customer.last_interaction).toLocaleDateString()}.` : 'This is their first time calling.'}
              ${customer.metadata?.tier ? `They are a ${customer.metadata.tier} tier member.` : ''}
              
              Be warm, friendly, and reference their first name (${firstName}) naturally in the conversation. 
              Make them feel valued and recognized.`,
            },
            first_message: `Hi ${firstName}! Thank you for calling. How can I help you today?`,
            language: customer.metadata?.preferred_language || 'en',
          },
        },
      };
    } else {
      // Customer not found - use default greeting
      console.log('Customer not found, using default greeting');
      
      response = {
        type: 'conversation_initiation_client_data',
        dynamic_variables: {
          customer_name: 'valued customer',
          customer_email: 'Unknown',
          account_status: 'new',
          last_interaction: 'First time caller',
          customer_tier: 'standard',
        },
        conversation_config_override: {
          agent: {
            prompt: {
              prompt: `This is a new caller (phone: ${caller_id}). 
              Be extra welcoming and helpful as this may be their first interaction with us.
              Try to gather their name early in the conversation so you can personalize the experience.`,
            },
            first_message: 'Hi! Thank you for calling. How can I help you today?',
            language: 'en',
          },
        },
      };
    }

    // Log the conversation in the database
    await supabase.from('conversations').insert({
      conversation_id: call_sid,
      phone_number: caller_id,
      agent_id: agent_id,
      status: 'initiated',
    });

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error in Twilio personalization webhook:', error);
    
    // Return a default response even if there's an error
    // This prevents the call from failing
    return NextResponse.json(
      {
        type: 'conversation_initiation_client_data',
        dynamic_variables: {
          customer_name: 'valued customer',
          customer_email: 'Unknown',
          account_status: 'active',
          last_interaction: 'Unknown',
          customer_tier: 'standard',
        },
        conversation_config_override: {
          agent: {
            first_message: 'Hi! Thank you for calling. How can I help you today?',
          },
        },
      },
      { headers: corsHeaders }
    );
  }
}

