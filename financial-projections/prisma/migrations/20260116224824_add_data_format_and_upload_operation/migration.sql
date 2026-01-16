-- CreateEnum
CREATE TYPE "UploadOperationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "DataFormat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataFormat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadOperation" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileType" TEXT NOT NULL DEFAULT '.csv',
    "operationStatus" "UploadOperationStatus" NOT NULL DEFAULT 'PENDING',
    "fileSize" INTEGER,
    "numberOfRecords" INTEGER,
    "fileS3Location" TEXT,
    "errorMessage" TEXT,
    "dataFormatId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadOperation_pkey" PRIMARY KEY ("id")
);

-- Insert seed data format
INSERT INTO "DataFormat" ("id", "name", "description", "createdAt", "updatedAt")
VALUES ('halifax_csv_format_001', 'HalifaxAccountExportCSV', 'Halifax bank account export CSV format', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- CreateIndex
CREATE UNIQUE INDEX "DataFormat_name_key" ON "DataFormat"("name");

-- CreateIndex
CREATE INDEX "UploadOperation_bankAccountId_idx" ON "UploadOperation"("bankAccountId");

-- CreateIndex
CREATE INDEX "UploadOperation_dataFormatId_idx" ON "UploadOperation"("dataFormatId");

-- CreateIndex
CREATE INDEX "UploadOperation_operationStatus_idx" ON "UploadOperation"("operationStatus");

-- CreateIndex
CREATE INDEX "UploadOperation_uploadDateTime_idx" ON "UploadOperation"("uploadDateTime");

-- AddForeignKey
ALTER TABLE "UploadOperation" ADD CONSTRAINT "UploadOperation_dataFormatId_fkey" FOREIGN KEY ("dataFormatId") REFERENCES "DataFormat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadOperation" ADD CONSTRAINT "UploadOperation_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
