import generateOpenApiSpec from '@omer-x/next-openapi-json-generator';
import {
  BankAccountDataSchema,
  BankAccountsGetResponseSchema,
  BankAccountCreateRequestSchema,
  BankAccountCreateResponseSchema,
  BankAccountGetResponseSchema,
  BankAccountUpdateRequestSchema,
  BankAccountUpdateResponseSchema,
  BankAccountDeleteResponseSchema,
} from '@/lib/schemas';
import { cleanSchemas } from '@/lib/openapi-utils';

/**
 * GET /api/openapi
 * Generate and return the OpenAPI 3.1.0 specification.
 * Only routes using defineRoute are included; standard handlers are skipped.
 *
 * Usage:
 *   curl http://localhost:3000/api/openapi | jq . > openapi.json
 */
export async function GET() {
  const spec = await generateOpenApiSpec(
    // Keys MUST match the exact variable names used in route files.
    // The generator strips imports and replaces these names with $ref strings.
    cleanSchemas({
      BankAccountDataSchema,
      BankAccountsGetResponseSchema,
      BankAccountGetResponseSchema,
      BankAccountCreateRequestSchema,
      BankAccountCreateResponseSchema,
      BankAccountUpdateRequestSchema,
      BankAccountUpdateResponseSchema,
      BankAccountDeleteResponseSchema,
    }),
    {
      info: {
        title: 'Financial Projections API',
        version: '0.1.0',
        description: 'API for the Financial Projections application',
      },
      servers: [{ url: 'http://localhost:3000' }],
    }
  );

  return Response.json(spec);
}
