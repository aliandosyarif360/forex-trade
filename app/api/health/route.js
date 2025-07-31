import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const envStatus = {
      clerk: {
        publishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        secretKey: !!process.env.CLERK_SECRET_KEY,
        isDemo: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('demo') || false
      },
      supabase: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        isDemo: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('demo') || false
      },
      polygon: {
        apiKey: !!process.env.POLYGON_API_KEY,
        isDemo: process.env.POLYGON_API_KEY?.includes('demo') || false
      },
      app: {
        demoMode: process.env.DEMO_MODE === 'true',
        nodeEnv: process.env.NODE_ENV
      }
    };

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envStatus,
      message: 'ForexBot Pro API is running successfully'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}