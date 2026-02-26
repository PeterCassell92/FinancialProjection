/**
 * Reproduction: fixSchema throws on .default() and .catch() Zod wrappers
 *
 * Package: @omer-x/next-openapi-json-generator v2.0.3
 * File:    dist/index.js → fixSchema() (line ~279)
 * Zod:     v4 (zod@^4.3.4)
 *
 * The fixSchema function only handles four wrapper types in its switch:
 *   nullable, optional, readonly, array
 *
 * Any other Zod wrapper type that has an .unwrap() method hits the default
 * case and throws: "${type} type is not covered in fixSchema"
 *
 * In Zod v4, .default() and .catch() both have .unwrap() and hit this path.
 * These are extremely common in real-world schemas (form defaults, config
 * objects, optional fields with fallbacks).
 *
 * ─────────────────────────────────────────────────────────────
 * HOW TO RUN (from a project with zod@4 installed):
 *   npx tsx fixSchema-issue-reproduction.ts
 *
 * EXPECTED: All schemas convert to JSON Schema without errors
 * ACTUAL:   .default() and .catch() throw
 * ─────────────────────────────────────────────────────────────
 */

import { z } from 'zod';

// ─── Inline copy of fixSchema from dist/index.js (lines 279-305) ───
// This is the EXACT code from the package, copied here so anyone can
// run this reproduction without needing a full Next.js app.
function fixSchema(schema: z.ZodType): z.ZodType {
  if ('unwrap' in schema && typeof (schema as any).unwrap === 'function') {
    switch ((schema as any)._zod.def.type) {
      case 'nullable':
        return fixSchema((schema as any).unwrap()).nullable();
      case 'optional':
        return fixSchema((schema as any).unwrap()).optional();
      case 'readonly':
        return fixSchema((schema as any).unwrap()).readonly();
      case 'array':
        return fixSchema((schema as any).unwrap()).array();
      default:
        throw new Error(
          `${(schema as any)._zod.def.type} type is not covered in fixSchema`
        );
    }
  }
  if ((schema as any)._zod.def.type === 'date') {
    return z.iso.datetime();
  }
  if ((schema as any)._zod.def.type === 'object') {
    const { shape } = schema as any;
    const entries = Object.entries(shape);
    const alteredEntries = entries.map(([propName, prop]) => [
      propName,
      fixSchema(prop as z.ZodType),
    ]);
    const newShape = Object.fromEntries(alteredEntries);
    return z.object(newShape);
  }
  return schema;
}

// Helper: attempt to convert a schema and report result
function testSchema(label: string, schema: z.ZodType) {
  try {
    const fixed = fixSchema(schema);
    const jsonSchema = z.toJSONSchema(fixed);
    console.log(`  PASS  ${label}`, JSON.stringify(jsonSchema));
  } catch (err) {
    console.log(`  FAIL  ${label}`);
    console.log(`        Error: ${(err as Error).message}`);
  }
}

// ─── Test cases ───

console.log('\n--- Types that work (handled by fixSchema) ---\n');

testSchema('z.string().optional()', z.string().optional());
testSchema('z.string().nullable()', z.string().nullable());
testSchema('z.number().readonly()', z.number().readonly());

console.log('\n--- Types that FAIL ---\n');

// 1. .default() standalone — e.g. config values
testSchema(
  'z.boolean().default(false)',
  z.boolean().default(false),
);

// 2. .default() chained after .optional() — common in request bodies
testSchema(
  'z.boolean().optional().default(true)',
  z.boolean().optional().default(true),
);

// 3. .catch() — fallback values
testSchema(
  'z.string().catch("fallback")',
  z.string().catch('fallback'),
);

// 4. .default() nested inside an object — the most realistic scenario.
//    fixSchema recurses into objects, so it encounters the nested .default()
testSchema(
  'z.object({ active: z.boolean().default(true) })',
  z.object({
    name: z.string(),
    active: z.boolean().default(true),
  }),
);

// 5. .default() inside an array element — fixSchema does NOT recurse arrays
testSchema(
  'z.array(z.number().default(0))',
  z.array(z.number().default(0)),
);

console.log('\n--- Real-world example (request body with defaults) ---\n');

const CreateItemRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
  tags: z.array(z.string()).default([]),
});

testSchema('CreateItemRequestSchema', CreateItemRequestSchema);

console.log(`
--- Suggested fix ---

The .default() and .catch() wrappers have no OpenAPI/JSON Schema
equivalent, but the inner schema still describes the type correctly.
fixSchema should unwrap them instead of throwing.

Minimal fix in src/core/zod-to-openapi.ts fixSchema():

  case "default":
  case "catch":
    return fixSchema(schema.unwrap());

A more future-proof approach — treat any unknown wrapper with .unwrap()
as safe to unwrap:

  default:
    return fixSchema(schema.unwrap());

Also: fixSchema doesn't recurse into z.array() elements, so
z.array(z.boolean().default(true)) would also fail. Consider adding
array element recursion alongside the existing object shape recursion.
`);
