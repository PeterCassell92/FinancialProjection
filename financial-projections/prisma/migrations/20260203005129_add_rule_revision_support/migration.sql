-- AlterTable
ALTER TABLE "RecurringProjectionEventRule" ADD COLUMN     "baseRuleId" TEXT,
ADD COLUMN     "isBaseRule" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "RecurringProjectionEventRule_baseRuleId_idx" ON "RecurringProjectionEventRule"("baseRuleId");

-- AddForeignKey
ALTER TABLE "RecurringProjectionEventRule" ADD CONSTRAINT "RecurringProjectionEventRule_baseRuleId_fkey" FOREIGN KEY ("baseRuleId") REFERENCES "RecurringProjectionEventRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
