import { prisma } from '@/lib/prisma';

/**
 * Database health status information
 */
export interface DatabaseHealthStatus {
  isConnected: boolean;
  latencyMs?: number;
  error?: string;
  lastChecked: Date;
}

/**
 * Check if the database is accessible and responding
 * @returns Health status information
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const startTime = Date.now();

  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;

    return {
      isConnected: true,
      latencyMs: Date.now() - startTime,
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date(),
    };
  }
}

/**
 * Determine if an error is a database connection error
 * @param error - The error to check
 * @returns true if it's a connection error
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('econnrefused') ||
      message.includes('connection refused') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes("can't reach database") ||
      message.includes('connect econnrefused') ||
      message.includes('prisma client initialization failed')
    );
  }
  return false;
}

/**
 * Determine if an error is a database query error (not a connection issue)
 * @param error - The error to check
 * @returns true if it's a query error
 */
export function isDatabaseQueryError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('invalid') ||
      message.includes('syntax error') ||
      message.includes('constraint') ||
      message.includes('foreign key') ||
      message.includes('unique constraint')
    );
  }
  return false;
}
