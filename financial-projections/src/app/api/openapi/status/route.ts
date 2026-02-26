import { openApiGenerationService } from '@/lib/services/openapi-generation-service';

/**
 * GET /api/openapi/status
 *
 * Returns the current generation status. No-cache headers so polling
 * always gets fresh data.
 */
export async function GET() {
  const status = await openApiGenerationService.getStatus();

  return Response.json(status, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    },
  });
}
