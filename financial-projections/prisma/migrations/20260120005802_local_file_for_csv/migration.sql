-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UploadOperationStatus" ADD VALUE 'CHECKING';
ALTER TYPE "UploadOperationStatus" ADD VALUE 'VALIDITY_CHECK_PASSED';
ALTER TYPE "UploadOperationStatus" ADD VALUE 'VALIDITY_CHECK_FAILED';

-- DropIndex
DROP INDEX "DailyBalance_date_key";

-- AlterTable
ALTER TABLE "UploadOperation" ADD COLUMN     "detectedAccountNumber" TEXT,
ADD COLUMN     "detectedSortCode" TEXT,
ADD COLUMN     "earliestDate" DATE,
ADD COLUMN     "latestDate" DATE,
ADD COLUMN     "localFileLocation" TEXT,
ALTER COLUMN "bankAccountId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TransactionUploadSource" (
    "id" TEXT NOT NULL,
    "transactionRecordId" TEXT NOT NULL,
    "uploadOperationId" TEXT NOT NULL,
    "csvRowNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionUploadSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionUploadSource_transactionRecordId_idx" ON "TransactionUploadSource"("transactionRecordId");

-- CreateIndex
CREATE INDEX "TransactionUploadSource_uploadOperationId_idx" ON "TransactionUploadSource"("uploadOperationId");

-- CreateIndex
CREATE INDEX "TransactionUploadSource_csvRowNumber_idx" ON "TransactionUploadSource"("csvRowNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionUploadSource_transactionRecordId_uploadOperation_key" ON "TransactionUploadSource"("transactionRecordId", "uploadOperationId");

-- CreateIndex
CREATE INDEX "UploadOperation_earliestDate_idx" ON "UploadOperation"("earliestDate");

-- CreateIndex
CREATE INDEX "UploadOperation_latestDate_idx" ON "UploadOperation"("latestDate");

-- AddForeignKey
ALTER TABLE "TransactionUploadSource" ADD CONSTRAINT "TransactionUploadSource_transactionRecordId_fkey" FOREIGN KEY ("transactionRecordId") REFERENCES "TransactionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionUploadSource" ADD CONSTRAINT "TransactionUploadSource_uploadOperationId_fkey" FOREIGN KEY ("uploadOperationId") REFERENCES "UploadOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
