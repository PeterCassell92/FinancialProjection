/*
  Warnings:

  - You are about to drop the column `isInitial` on the `ProjectionEvent` table. All the data in the column will be lost.
  - You are about to drop the column `isRecurring` on the `ProjectionEvent` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyEventDay` on the `ProjectionEvent` table. All the data in the column will be lost.
  - You are about to drop the column `onTheSameDateEachMonth` on the `ProjectionEvent` table. All the data in the column will be lost.
  - You are about to drop the column `recurringEventId` on the `ProjectionEvent` table. All the data in the column will be lost.
  - You are about to drop the column `untilTargetDate` on the `ProjectionEvent` table. All the data in the column will be lost.
  - You are about to drop the `EventRecurringDate` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('GBP', 'USD');

-- CreateEnum
CREATE TYPE "DateFormat" AS ENUM ('UK', 'US');

-- DropForeignKey
ALTER TABLE "EventRecurringDate" DROP CONSTRAINT "EventRecurringDate_projectionEventId_fkey";

-- DropIndex
DROP INDEX "ProjectionEvent_isInitial_idx";

-- DropIndex
DROP INDEX "ProjectionEvent_recurringEventId_idx";

-- AlterTable
ALTER TABLE "ProjectionEvent" DROP COLUMN "isInitial",
DROP COLUMN "isRecurring",
DROP COLUMN "monthlyEventDay",
DROP COLUMN "onTheSameDateEachMonth",
DROP COLUMN "recurringEventId",
DROP COLUMN "untilTargetDate",
ADD COLUMN     "decisionPathId" TEXT,
ADD COLUMN     "recurringRuleId" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'GBP',
ADD COLUMN     "dateFormat" "DateFormat" NOT NULL DEFAULT 'UK';

-- DropTable
DROP TABLE "EventRecurringDate";

-- CreateTable
CREATE TABLE "RecurringProjectionEventRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value" DECIMAL(10,2) NOT NULL,
    "type" "EventType" NOT NULL,
    "certainty" "CertaintyLevel" NOT NULL,
    "payTo" TEXT,
    "paidBy" TEXT,
    "decisionPathId" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL DEFAULT 'MONTHLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringProjectionEventRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionPath" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioSetDecisionPath" (
    "id" TEXT NOT NULL,
    "scenarioSetId" TEXT NOT NULL,
    "decisionPathId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ScenarioSetDecisionPath_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringProjectionEventRule_decisionPathId_idx" ON "RecurringProjectionEventRule"("decisionPathId");

-- CreateIndex
CREATE INDEX "RecurringProjectionEventRule_startDate_idx" ON "RecurringProjectionEventRule"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionPath_name_key" ON "DecisionPath"("name");

-- CreateIndex
CREATE INDEX "ScenarioSet_isDefault_idx" ON "ScenarioSet"("isDefault");

-- CreateIndex
CREATE INDEX "ScenarioSetDecisionPath_scenarioSetId_idx" ON "ScenarioSetDecisionPath"("scenarioSetId");

-- CreateIndex
CREATE INDEX "ScenarioSetDecisionPath_decisionPathId_idx" ON "ScenarioSetDecisionPath"("decisionPathId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioSetDecisionPath_scenarioSetId_decisionPathId_key" ON "ScenarioSetDecisionPath"("scenarioSetId", "decisionPathId");

-- CreateIndex
CREATE INDEX "ProjectionEvent_decisionPathId_idx" ON "ProjectionEvent"("decisionPathId");

-- CreateIndex
CREATE INDEX "ProjectionEvent_recurringRuleId_idx" ON "ProjectionEvent"("recurringRuleId");

-- AddForeignKey
ALTER TABLE "RecurringProjectionEventRule" ADD CONSTRAINT "RecurringProjectionEventRule_decisionPathId_fkey" FOREIGN KEY ("decisionPathId") REFERENCES "DecisionPath"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectionEvent" ADD CONSTRAINT "ProjectionEvent_decisionPathId_fkey" FOREIGN KEY ("decisionPathId") REFERENCES "DecisionPath"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectionEvent" ADD CONSTRAINT "ProjectionEvent_recurringRuleId_fkey" FOREIGN KEY ("recurringRuleId") REFERENCES "RecurringProjectionEventRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioSetDecisionPath" ADD CONSTRAINT "ScenarioSetDecisionPath_scenarioSetId_fkey" FOREIGN KEY ("scenarioSetId") REFERENCES "ScenarioSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioSetDecisionPath" ADD CONSTRAINT "ScenarioSetDecisionPath_decisionPathId_fkey" FOREIGN KEY ("decisionPathId") REFERENCES "DecisionPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;
