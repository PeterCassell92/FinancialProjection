-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('EXPENSE', 'INCOMING');

-- CreateEnum
CREATE TYPE "CertaintyLevel" AS ENUM ('UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN');

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "initialBankBalance" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectionEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value" DECIMAL(10,2) NOT NULL,
    "type" "EventType" NOT NULL,
    "certainty" "CertaintyLevel" NOT NULL,
    "payTo" TEXT,
    "paidBy" TEXT,
    "date" DATE NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringEventId" TEXT,
    "onTheSameDateEachMonth" BOOLEAN NOT NULL DEFAULT false,
    "monthlyEventDay" INTEGER,
    "untilTargetDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRecurringDate" (
    "id" TEXT NOT NULL,
    "projectionEventId" TEXT NOT NULL,
    "recurringEventId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRecurringDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBalance" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "expectedBalance" DECIMAL(10,2) NOT NULL,
    "actualBalance" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectionEvent_date_idx" ON "ProjectionEvent"("date");

-- CreateIndex
CREATE INDEX "ProjectionEvent_recurringEventId_idx" ON "ProjectionEvent"("recurringEventId");

-- CreateIndex
CREATE INDEX "EventRecurringDate_projectionEventId_idx" ON "EventRecurringDate"("projectionEventId");

-- CreateIndex
CREATE INDEX "EventRecurringDate_recurringEventId_idx" ON "EventRecurringDate"("recurringEventId");

-- CreateIndex
CREATE INDEX "EventRecurringDate_date_idx" ON "EventRecurringDate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBalance_date_key" ON "DailyBalance"("date");

-- CreateIndex
CREATE INDEX "DailyBalance_date_idx" ON "DailyBalance"("date");

-- AddForeignKey
ALTER TABLE "EventRecurringDate" ADD CONSTRAINT "EventRecurringDate_projectionEventId_fkey" FOREIGN KEY ("projectionEventId") REFERENCES "ProjectionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
