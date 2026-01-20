-- AlterTable
ALTER TABLE "TransactionSpendingType" ADD COLUMN     "appliedManually" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "categorizationRuleId" TEXT;

-- CreateIndex
CREATE INDEX "TransactionSpendingType_categorizationRuleId_idx" ON "TransactionSpendingType"("categorizationRuleId");

-- AddForeignKey
ALTER TABLE "TransactionSpendingType" ADD CONSTRAINT "TransactionSpendingType_categorizationRuleId_fkey" FOREIGN KEY ("categorizationRuleId") REFERENCES "TransactionCategorizationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
