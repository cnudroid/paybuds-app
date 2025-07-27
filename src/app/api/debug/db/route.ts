import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const result = await db.$queryRaw`SELECT 1 as test`;
    
    // Test if we can query users table
    const userCount = await db.user.count();
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        testQuery: result,
        userCount: userCount
      },
      envVars: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      environment: process.env.NODE_ENV,
      error: error instanceof Error ? error.message : 'Unknown database error',
      envVars: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
      }
    }, { status: 500 });
  }
}
