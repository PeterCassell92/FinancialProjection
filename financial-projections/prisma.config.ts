// Load .env file for local development (not needed in Docker where env vars are provided)
// eslint-disable-next-line @typescript-eslint/no-require-imports
try { require('dotenv/config'); } catch { /* dotenv not available */ }

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
