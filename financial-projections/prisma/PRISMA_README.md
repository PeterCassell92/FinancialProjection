# Prisma Guide for Financial Projections App

This guide covers how to use Prisma in this project for database schema management, migrations, and data access.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Regular Workflow](#regular-workflow)
3. [Manual Migration Workflow](#manual-migration-workflow)
4. [Database Introspection](#database-introspection)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Quick Reference

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a new migration (auto-generated SQL)
npx prisma migrate dev --name description_of_change

# Create migration file without applying (for manual editing)
npx prisma migrate dev --create-only --name description_of_change

# Apply pending migrations
npx prisma migrate deploy

# Reset database (DESTRUCTIVE - deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Pull schema from existing database
npx prisma db pull

# Push schema to database (dev only, skips migrations)
npx prisma db push
```

---

## Regular Workflow

### 1. Making Schema Changes

Edit `prisma/schema.prisma` to add/modify models:

```prisma
model NewModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Generate Migration

Let Prisma automatically generate the SQL migration:

```bash
npx prisma migrate dev --name add_new_model
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your local database
- Regenerate the Prisma Client

### 3. Regenerate Client (if needed)

If you only changed schema without migrating:

```bash
npx prisma generate
```

This updates the TypeScript types for your models.

---

## Manual Migration Workflow

**When to use**: When you need to preserve existing data or write custom SQL logic.

### Step 1: Create Migration File (Don't Apply)

```bash
npx prisma migrate dev --create-only --name your_migration_name
```

This creates the migration file but **doesn't apply it**.

### Step 2: Edit the Migration SQL

Navigate to the newest migration file:
```
prisma/migrations/YYYYMMDDHHMMSS_your_migration_name/migration.sql
```

Edit the SQL to include data preservation logic. Example:

```sql
-- Example: Adding a required column to a table with existing data

-- Step 1: Add column as nullable
ALTER TABLE "ProjectionEvent" ADD COLUMN "bankAccountId" TEXT;

-- Step 2: Update existing rows with a default value
UPDATE "ProjectionEvent"
SET "bankAccountId" = 'seed_bank_account_001'
WHERE "bankAccountId" IS NULL;

-- Step 3: Make column NOT NULL
ALTER TABLE "ProjectionEvent" ALTER COLUMN "bankAccountId" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "ProjectionEvent"
ADD CONSTRAINT "ProjectionEvent_bankAccountId_fkey"
FOREIGN KEY ("bankAccountId")
REFERENCES "BankAccount"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Step 5: Create index for performance
CREATE INDEX "ProjectionEvent_bankAccountId_idx" ON "ProjectionEvent"("bankAccountId");
```

### Step 3: Apply the Migration Manually

**Option A: Using psql directly**

```bash
cd /home/pete/Documents/Projects/FinancialProjections/financial-projections

PGPASSWORD=your_password psql -U your_user -d financial_projections -f prisma/migrations/YYYYMMDDHHMMSS_your_migration_name/migration.sql
```

**Option B: Using Prisma's migrate resolve**

```bash
# Mark the migration as applied without running it
npx prisma migrate resolve --applied YYYYMMDDHHMMSS_your_migration_name

# Then run the SQL manually as above
```

### Step 4: Mark as Applied (if using psql)

After manually running the SQL:

```bash
npx prisma migrate resolve --applied YYYYMMDDHHMMSS_your_migration_name
```

### Step 5: Regenerate Prisma Client

```bash
npx prisma generate
```

---

## Database Introspection

### When to Use `prisma db pull`

Use when you:
- Made changes directly to the database (not recommended for production)
- Want to generate a schema from an existing database
- Need to sync your schema with manual database changes

```bash
npx prisma db pull
```

This will:
- Introspect your database
- Update `prisma/schema.prisma` to match the current database state
- **WARNING**: Overwrites your schema file - commit first!

### After Pull

```bash
# Regenerate the client with new schema
npx prisma generate
```

---

## Common Tasks

### View Database in GUI

```bash
npx prisma studio
```

Opens at `http://localhost:5555` - browse and edit data visually.

### Check Migration Status

```bash
npx prisma migrate status
```

Shows which migrations are applied and which are pending.

### Seed the Database

Create a seed file at `prisma/seed.ts` (if it doesn't exist):

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Your seed data here
  await prisma.bankAccount.create({
    data: {
      id: 'seed_bank_account_001',
      name: 'Main Current Account',
      sortCode: '01-23-45',
      accountNumber: '11334111',
      provider: 'HALIFAX',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run the seed:

```bash
npx prisma db seed
```

### Reset Database and Reseed

**WARNING: Deletes all data!**

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Recreate it
3. Apply all migrations
4. Run seed script (if configured)

---

## Migration Best Practices

### 1. Always Backup Data

Before manual migrations with existing data:

```bash
pg_dump -U your_user financial_projections > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Test Migrations Locally First

Never run untested migrations on production data.

### 3. Use Transactions

Wrap manual SQL in transactions when possible:

```sql
BEGIN;

-- Your migration SQL here

COMMIT;
-- Or ROLLBACK; if something went wrong
```

### 4. Preserve Data Pattern

When adding required fields to tables with data:
1. Add column as **nullable**
2. Populate existing rows
3. Make column **NOT NULL**
4. Add constraints

### 5. Naming Conventions

Migration names should be descriptive:
-  `add_bank_account_to_projection_events`
-  `create_transaction_records_table`
- L `update_schema`
- L `fix_stuff`

---

## Project-Specific Notes

### Database Configuration

This project uses PostgreSQL locally. Connection string is in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/financial_projections?schema=public"
```

### Seed Account

The project includes a seed bank account with ID `seed_bank_account_001`:
- Sort Code: `22-33-44`
- Account Number: `12345678`
- Provider: `HALIFAX`

This is used as the default for existing records when adding bank account foreign keys.

### Foreign Key Constraints

All foreign keys use:
- `onDelete: Restrict` for bank accounts (prevents deletion if in use)
- `onDelete: Cascade` for parent-child relationships (e.g., recurring rules � events)
- `onDelete: SetNull` for optional relationships (e.g., default bank account in settings)

---

## Troubleshooting

### Migration Out of Sync

If Prisma says migrations are out of sync:

```bash
# Check status
npx prisma migrate status

# Option 1: Mark specific migration as applied
npx prisma migrate resolve --applied MIGRATION_NAME

# Option 2: Mark as rolled back
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Option 3: Reset and start fresh (DESTRUCTIVE)
npx prisma migrate reset
```

### Schema Drift Detected

If schema doesn't match database:

```bash
# Pull current database state
npx prisma db pull

# Or push schema to database (dev only, no migrations)
npx prisma db push
```

### Client Out of Date

If you get type errors after schema changes:

```bash
npx prisma generate
```

### Connection Issues

Check your `.env` file:
- Ensure `DATABASE_URL` is correct
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Test connection: `psql -U your_user -d financial_projections`

### Migration Failed Halfway

If a migration fails partway through:

1. Check what was applied:
```sql
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 5;
```

2. Manually fix the database or rollback changes

3. Mark migration as rolled back:
```bash
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

4. Fix the migration SQL and try again

---

## Additional Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Migrate Reference](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## Package Manager

This project uses **yarn** for package management:

```bash
# Install Prisma CLI
yarn add -D prisma

# Install Prisma Client
yarn add @prisma/client

# Run Prisma commands
npx prisma [command]
```
