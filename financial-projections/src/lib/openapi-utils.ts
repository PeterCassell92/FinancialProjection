import { z, type ZodType } from 'zod';

/**
 * Recursively strip .default() wrappers from Zod schemas so the
 * openapi-json-generator's fixSchema doesn't choke on unsupported types.
 * This keeps the real schemas untouched - only the copies passed to the
 * generator are modified.
 */
function stripDefaults(schema: ZodType): ZodType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (schema as any)._zod?.def;
  if (!def) return schema;

  if (def.type === 'default') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return stripDefaults((schema as any).unwrap());
  }

  if (def.type === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shape = (schema as any).shape;
    const newShape: Record<string, ZodType> = {};
    for (const [key, value] of Object.entries(shape)) {
      newShape[key] = stripDefaults(value as ZodType);
    }
    return z.object(newShape);
  }

  return schema;
}

/** Strip .default() wrappers from all schemas in a record */
export function cleanSchemas<T extends Record<string, ZodType>>(schemas: T): T {
  const cleaned = {} as Record<string, ZodType>;
  for (const [key, value] of Object.entries(schemas)) {
    cleaned[key] = stripDefaults(value);
  }
  return cleaned as T;
}
