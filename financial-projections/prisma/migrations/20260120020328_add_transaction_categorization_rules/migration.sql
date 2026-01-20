-- CreateTable
CREATE TABLE "TransactionCategorizationRule" (
    "id" TEXT NOT NULL,
    "descriptionString" TEXT NOT NULL,
    "exactMatch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionCategorizationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorizationRuleSpendingType" (
    "id" TEXT NOT NULL,
    "categorizationRuleId" TEXT NOT NULL,
    "spendingTypeId" TEXT NOT NULL,

    CONSTRAINT "CategorizationRuleSpendingType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionCategorizationRule_descriptionString_idx" ON "TransactionCategorizationRule"("descriptionString");

-- CreateIndex
CREATE INDEX "CategorizationRuleSpendingType_categorizationRuleId_idx" ON "CategorizationRuleSpendingType"("categorizationRuleId");

-- CreateIndex
CREATE INDEX "CategorizationRuleSpendingType_spendingTypeId_idx" ON "CategorizationRuleSpendingType"("spendingTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CategorizationRuleSpendingType_categorizationRuleId_spendin_key" ON "CategorizationRuleSpendingType"("categorizationRuleId", "spendingTypeId");

-- AddForeignKey
ALTER TABLE "CategorizationRuleSpendingType" ADD CONSTRAINT "CategorizationRuleSpendingType_categorizationRuleId_fkey" FOREIGN KEY ("categorizationRuleId") REFERENCES "TransactionCategorizationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorizationRuleSpendingType" ADD CONSTRAINT "CategorizationRuleSpendingType_spendingTypeId_fkey" FOREIGN KEY ("spendingTypeId") REFERENCES "SpendingType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
