-- AlterTable: Add defaultBankAccountId to Settings
ALTER TABLE "Settings" ADD COLUMN "defaultBankAccountId" TEXT;

-- Set the seed bank account as the default for existing settings
UPDATE "Settings" SET "defaultBankAccountId" = 'seed_bank_account_001' WHERE "defaultBankAccountId" IS NULL;

-- CreateIndex
CREATE INDEX "Settings_defaultBankAccountId_idx" ON "Settings"("defaultBankAccountId");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_defaultBankAccountId_fkey" FOREIGN KEY ("defaultBankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
