import { openApiGenerationService } from '@/lib/services/openapi-generation-service';

/**
 * POST /api/openapi/generate
 *
 * Trigger a new OpenAPI spec generation (fire-and-forget).
 * - 202: generation started
 * - 409: generation already in progress
 */
export async function POST() {
  const started = await openApiGenerationService.startGeneration();

  if (!started) {
    return Response.json(
      { error: 'Generation already in progress' },
      { status: 409 }
    );
  }

  return Response.json(
    { message: 'Generation started. Poll /api/openapi/status for progress.' },
    { status: 202 }
  );
}
