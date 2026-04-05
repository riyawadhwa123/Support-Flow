/**
 * Test Supabase connectivity and configuration
 * Run this in the browser console to debug connection issues
 */
export async function testSupabaseConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Testing Supabase Connection...');
  console.log('URL:', url);
  console.log('Key present:', !!key);

  if (!url || !key) {
    console.error('Missing Supabase URL or Key');
    return false;
  }

  try {
    // Test basic connectivity by calling the REST API
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    console.log('REST API Response:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('✅ Supabase connectivity: OK');
      return true;
    } else {
      console.error('❌ Supabase REST API failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase connectivity test failed:', error);
    return false;
  }
}

/**
 * Test auth endpoint connectivity
 */
export async function testSupabaseAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Testing Supabase Auth Endpoint...');

  if (!url || !key) {
    console.error('Missing Supabase URL or Key');
    return false;
  }

  try {
    const response = await fetch(`${url}/auth/v1/`, {
      method: 'GET',
      headers: {
        apikey: key,
      },
    });

    console.log('Auth Endpoint Response:', response.status);
    
    if (response.ok) {
      console.log('✅ Supabase auth endpoint: OK');
      return true;
    } else {
      console.error('❌ Supabase auth endpoint failed:', response.status);
      const text = await response.text();
      console.error('Response:', text);
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase auth test failed:', error);
    return false;
  }
}
