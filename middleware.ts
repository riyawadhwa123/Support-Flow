import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicPaths = ['/', '/login', '/chat'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  
  // Allow public access to Stripe API routes (for ElevenLabs webhook calls)
  const isStripeAPI = request.nextUrl.pathname.startsWith('/api/stripe/');
  
  // Allow public access to ElevenLabs API routes (including Twilio personalization webhook)
  const isElevenLabsAPI = request.nextUrl.pathname.startsWith('/api/elevenlabs/');

  // Allow public access to chat API
  const isChatAPI = request.nextUrl.pathname.startsWith('/api/chat');
  
  // Allow public access to health check
  const isHealthCheck = request.nextUrl.pathname === '/api/health';

  // Logged-in users land on the dashboard when visiting auth/public routes
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Guests can view public marketing pages and public API routes, everything else requires auth
  if (!user && !isPublicPath && !isStripeAPI && !isElevenLabsAPI && !isChatAPI && !isHealthCheck) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

