/*
  Warnings:

  - Added the required column `initialBalanceDate` to the `Settings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- First add the column as nullable
ALTER TABLE "Settings" ADD COLUMN "initialBalanceDate" DATE;

-- Set the default value to today for existing rows
UPDATE "Settings" SET "initialBalanceDate" = CURRENT_DATE WHERE "initialBalanceDate" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "Settings" ALTER COLUMN "initialBalanceDate" SET NOT NULL;
