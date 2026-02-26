import { z } from 'zod';

/**
 * Shared response format enum for API endpoints that support
 * alternative response formats (e.g. cartoon/toon summaries).
 *
 * Add new formats here and all routes will pick them up automatically.
 */
export const ResponseFormatSchema = z.enum(['json', 'toon']).optional();

export type ResponseFormat = z.infer<typeof ResponseFormatSchema>;
