-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CATEGORIZATION_RULE_CREATED', 'CATEGORIZATION_RULE_UPDATED', 'CATEGORIZATION_RULE_DELETED', 'CATEGORIZATION_RULE_APPLIED', 'CATEGORIZATION_RULES_APPLIED_ALL', 'SPENDING_TYPE_CREATED', 'SPENDING_TYPE_UPDATED', 'SPENDING_TYPE_DELETED', 'SPENDING_TYPES_REMOVED', 'TRANSACTION_CREATED', 'TRANSACTION_UPDATED', 'TRANSACTION_DELETED', 'TRANSACTIONS_BULK_DELETED', 'TRANSACTIONS_MASS_UPDATED', 'CSV_UPLOAD_STARTED', 'CSV_UPLOAD_COMPLETED', 'CSV_UPLOAD_FAILED', 'BANK_ACCOUNT_CREATED', 'BANK_ACCOUNT_UPDATED', 'BANK_ACCOUNT_DELETED');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('ONGOING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'HumanUser',
    "activityName" TEXT NOT NULL,
    "activityDisplayName" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'ONGOING',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "message" TEXT,
    "metadata" JSONB,
    "errorDetails" TEXT,
    "progress" INTEGER,
    "totalItems" INTEGER,
    "processedItems" INTEGER,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_activityType_idx" ON "ActivityLog"("activityType");

-- CreateIndex
CREATE INDEX "ActivityLog_status_idx" ON "ActivityLog"("status");

-- CreateIndex
CREATE INDEX "ActivityLog_startTime_idx" ON "ActivityLog"("startTime");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
