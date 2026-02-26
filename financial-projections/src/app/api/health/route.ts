import defineRoute from '@omer-x/next-openapi-route-handler';
import { checkDatabaseHealth } from '@/lib/dal/health-check';

/**
 * GET /api/health
 * Returns the health status of the application and its dependencies
 */
export const { GET } = defineRoute({
  operationId: 'getHealthStatus',
  method: 'GET',
  summary: 'Health check',
  description: 'Returns the health status of the application and its dependencies',
  tags: ['Health'],
  action: async () => {
    const dbHealth = await checkDatabaseHealth();

    const overallHealth = dbHealth.isConnected;

    return Response.json(
      {
        status: overallHealth ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbHealth,
        version: process.env.npm_package_version || 'unknown',
      },
      { status: overallHealth ? 200 : 503 }
    );
  },
  responses: {
    200: { description: 'Application is healthy' },
    503: { description: 'Application is unhealthy' },
  },
});
