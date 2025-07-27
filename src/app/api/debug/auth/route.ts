import { NextRequest, NextResponse } from 'next/server';
import { getSession, getCurrentUser } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const user = await getCurrentUser();
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      hasSession: !!session,
      hasUser: !!user,
      sessionUser: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      } : null,
      envVars: {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL
      }
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}
