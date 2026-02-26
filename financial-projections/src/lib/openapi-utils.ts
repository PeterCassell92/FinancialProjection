import { z, type ZodType } from 'zod';

/**
 * Recursively strip .default() and .refine()/.transform() wrappers from Zod
 * schemas so the openapi-json-generator's fixSchema doesn't choke on
 * unsupported types.  This keeps the real schemas untouched – only the copies
 * passed to the generator are modified.
 */
function stripUnsupported(schema: ZodType): ZodType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = schema as any;
  const def = s._zod?.def;
  if (!def) return schema;

  // .default() – strip it entirely, keep the inner schema
  if (def.type === 'default') {
    return stripUnsupported(s.unwrap());
  }

  // .refine() / .superRefine() / .transform() – unwrap to inner schema
  if (def.type === 'effects' || def.type === 'pipeline') {
    const inner = def.innerType ?? def.in;
    if (inner) {
      return stripUnsupported(inner);
    }
  }

  // .optional() – recurse into the inner schema, re-wrap
  if (def.type === 'optional') {
    const inner = s.unwrap ? s.unwrap() : def.innerType;
    if (inner) {
      return stripUnsupported(inner).optional();
    }
  }

  // .nullable() – recurse into the inner schema, re-wrap
  if (def.type === 'nullable') {
    const inner = s.unwrap ? s.unwrap() : def.innerType;
    if (inner) {
      return stripUnsupported(inner).nullable();
    }
  }

  // Recurse into object shapes
  if (def.type === 'object') {
    const shape = s.shape;
    if (shape) {
      const newShape: Record<string, ZodType> = {};
      for (const [key, value] of Object.entries(shape)) {
        newShape[key] = stripUnsupported(value as ZodType);
      }
      return z.object(newShape);
    }
  }

  // Recurse into arrays
  if (def.type === 'array') {
    const element = s.element ?? def.element;
    if (element) {
      return z.array(stripUnsupported(element));
    }
  }

  return schema;
}

/** Strip unsupported wrappers (.default(), .refine(), etc.) from all schemas */
export function cleanSchemas<T extends Record<string, ZodType>>(schemas: T): T {
  const cleaned = {} as Record<string, ZodType>;
  for (const [key, value] of Object.entries(schemas)) {
    cleaned[key] = stripUnsupported(value);
  }
  return cleaned as T;
}
