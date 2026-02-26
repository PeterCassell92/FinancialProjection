import { openApiGenerationService } from '@/lib/services/openapi-generation-service';

/**
 * GET /api/openapi
 *
 * Serve the latest OpenAPI spec from disk.
 * - 200: spec found, returns JSON
 * - 202: no spec on disk, generation has been auto-triggered (or is already running)
 */
export async function GET() {
  const spec = await openApiGenerationService.readLatestSpec();

  if (spec) {
    return Response.json(spec);
  }

  // No spec exists — auto-trigger generation on first visit
  const status = await openApiGenerationService.getStatus();

  if (status.state !== 'generating') {
    await openApiGenerationService.startGeneration();
  }

  return Response.json(
    { generating: true, message: 'OpenAPI spec is being generated. Poll /api/openapi/status for progress.' },
    { status: 202 }
  );
}
