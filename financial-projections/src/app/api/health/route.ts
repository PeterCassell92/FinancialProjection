import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/dal/health-check';

/**
 * Health check endpoint
 * Returns the health status of the application and its dependencies
 */
export async function GET() {
  const dbHealth = await checkDatabaseHealth();

  const overallHealth = dbHealth.isConnected;

  return NextResponse.json(
    {
      status: overallHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      version: process.env.npm_package_version || 'unknown',
    },
    { status: overallHealth ? 200 : 503 }
  );
}
