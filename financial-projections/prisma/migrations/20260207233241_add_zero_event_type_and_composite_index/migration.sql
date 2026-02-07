-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'ZERO_EVENT';

-- CreateIndex
CREATE INDEX "TransactionRecord_bankAccountId_transactionDate_idx" ON "TransactionRecord"("bankAccountId", "transactionDate");
