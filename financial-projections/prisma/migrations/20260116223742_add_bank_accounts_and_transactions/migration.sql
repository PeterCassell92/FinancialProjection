-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEB', 'DD', 'CHG', 'CR', 'SO', 'BP', 'TFR', 'FPI', 'FPO', 'ATM', 'DEP', 'INT', 'FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "BankProvider" AS ENUM ('HALIFAX', 'LLOYDS', 'BANK_OF_SCOTLAND', 'BARCLAYS', 'HSBC', 'NATIONWIDE', 'SANTANDER', 'NATWEST', 'RBS', 'TSB', 'OTHER');

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "provider" "BankProvider" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionRecord" (
    "id" TEXT NOT NULL,
    "transactionDate" DATE NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "transactionDescription" TEXT NOT NULL,
    "debitAmount" DECIMAL(10,2),
    "creditAmount" DECIMAL(10,2),
    "balance" DECIMAL(10,2) NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpendingType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpendingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionSpendingType" (
    "id" TEXT NOT NULL,
    "transactionRecordId" TEXT NOT NULL,
    "spendingTypeId" TEXT NOT NULL,

    CONSTRAINT "TransactionSpendingType_pkey" PRIMARY KEY ("id")
);

-- Insert seed bank account
INSERT INTO "BankAccount" ("id", "name", "description", "sortCode", "accountNumber", "provider", "createdAt", "updatedAt")
VALUES ('seed_bank_account_001', 'Main Current Account', 'main current account', 'REDACTED', 'REDACTED', 'HALIFAX', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: Add bankAccountId to RecurringProjectionEventRule (nullable first)
ALTER TABLE "RecurringProjectionEventRule" ADD COLUMN "bankAccountId" TEXT;

-- AlterTable: Add bankAccountId to ProjectionEvent (nullable first)
ALTER TABLE "ProjectionEvent" ADD COLUMN "bankAccountId" TEXT;

-- AlterTable: Drop the unique constraint on DailyBalance.date first (if it exists)
ALTER TABLE "DailyBalance" DROP CONSTRAINT IF EXISTS "DailyBalance_date_key";

-- AlterTable: Add bankAccountId to DailyBalance (nullable first)
ALTER TABLE "DailyBalance" ADD COLUMN "bankAccountId" TEXT;

-- Update all existing records to use the seed bank account
UPDATE "RecurringProjectionEventRule" SET "bankAccountId" = 'seed_bank_account_001' WHERE "bankAccountId" IS NULL;
UPDATE "ProjectionEvent" SET "bankAccountId" = 'seed_bank_account_001' WHERE "bankAccountId" IS NULL;
UPDATE "DailyBalance" SET "bankAccountId" = 'seed_bank_account_001' WHERE "bankAccountId" IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE "RecurringProjectionEventRule" ALTER COLUMN "bankAccountId" SET NOT NULL;
ALTER TABLE "ProjectionEvent" ALTER COLUMN "bankAccountId" SET NOT NULL;
ALTER TABLE "DailyBalance" ALTER COLUMN "bankAccountId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_sortCode_accountNumber_key" ON "BankAccount"("sortCode", "accountNumber");

-- CreateIndex
CREATE INDEX "BankAccount_sortCode_idx" ON "BankAccount"("sortCode");

-- CreateIndex
CREATE INDEX "TransactionRecord_bankAccountId_idx" ON "TransactionRecord"("bankAccountId");

-- CreateIndex
CREATE INDEX "TransactionRecord_transactionDate_idx" ON "TransactionRecord"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "SpendingType_name_key" ON "SpendingType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionSpendingType_transactionRecordId_spendingTypeId_key" ON "TransactionSpendingType"("transactionRecordId", "spendingTypeId");

-- CreateIndex
CREATE INDEX "TransactionSpendingType_transactionRecordId_idx" ON "TransactionSpendingType"("transactionRecordId");

-- CreateIndex
CREATE INDEX "TransactionSpendingType_spendingTypeId_idx" ON "TransactionSpendingType"("spendingTypeId");

-- CreateIndex
CREATE INDEX "RecurringProjectionEventRule_bankAccountId_idx" ON "RecurringProjectionEventRule"("bankAccountId");

-- CreateIndex
CREATE INDEX "ProjectionEvent_bankAccountId_idx" ON "ProjectionEvent"("bankAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBalance_date_bankAccountId_key" ON "DailyBalance"("date", "bankAccountId");

-- CreateIndex
CREATE INDEX "DailyBalance_bankAccountId_idx" ON "DailyBalance"("bankAccountId");

-- AddForeignKey
ALTER TABLE "RecurringProjectionEventRule" ADD CONSTRAINT "RecurringProjectionEventRule_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectionEvent" ADD CONSTRAINT "ProjectionEvent_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyBalance" ADD CONSTRAINT "DailyBalance_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionRecord" ADD CONSTRAINT "TransactionRecord_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionSpendingType" ADD CONSTRAINT "TransactionSpendingType_transactionRecordId_fkey" FOREIGN KEY ("transactionRecordId") REFERENCES "TransactionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionSpendingType" ADD CONSTRAINT "TransactionSpendingType_spendingTypeId_fkey" FOREIGN KEY ("spendingTypeId") REFERENCES "SpendingType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
