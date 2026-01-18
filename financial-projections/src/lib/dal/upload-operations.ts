import prisma from '@/lib/prisma';
import { UploadOperation, UploadOperationStatus, DataFormat, BankAccount, Prisma } from '@prisma/client';

export interface CreateUploadOperationInput {
  filename: string;
  fileType?: string;
  fileSize?: number;
  dataFormatId: string;
  bankAccountId?: string;  // Now optional for preflight check
  localFileLocation?: string;
}

export type UploadOperationWithRelations = UploadOperation & {
  bankAccount: BankAccount | null;
  dataFormat: DataFormat;
};

export interface UpdateUploadOperationInput {
  operationStatus?: UploadOperationStatus;
  numberOfRecords?: number;
  errorMessage?: string;
  fileS3Location?: string;
  localFileLocation?: string;
  earliestDate?: Date;
  latestDate?: Date;
  detectedAccountNumber?: string;
  detectedSortCode?: string;
  bankAccountId?: string;
}

/**
 * Get all data formats
 */
export async function getAllDataFormats(): Promise<DataFormat[]> {
  return await prisma.dataFormat.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Get a data format by ID
 */
export async function getDataFormatById(id: string): Promise<DataFormat | null> {
  return await prisma.dataFormat.findUnique({
    where: { id },
  });
}

/**
 * Get a data format by name
 */
export async function getDataFormatByName(name: string): Promise<DataFormat | null> {
  return await prisma.dataFormat.findUnique({
    where: { name },
  });
}

/**
 * Get all upload operations
 */
export async function getAllUploadOperations(): Promise<UploadOperation[]> {
  return await prisma.uploadOperation.findMany({
    include: {
      bankAccount: true,
      dataFormat: true,
    },
    orderBy: { uploadDateTime: 'desc' },
  });
}

/**
 * Get upload operations for a specific bank account
 */
export async function getUploadOperationsByBankAccount(
  bankAccountId: string
): Promise<UploadOperation[]> {
  return await prisma.uploadOperation.findMany({
    where: { bankAccountId },
    include: {
      dataFormat: true,
    },
    orderBy: { uploadDateTime: 'desc' },
  });
}

/**
 * Get an upload operation by ID with relations
 */
export async function getUploadOperationById(id: string): Promise<UploadOperationWithRelations | null> {
  return await prisma.uploadOperation.findUnique({
    where: { id },
    include: {
      bankAccount: true,
      dataFormat: true,
    },
  });
}

/**
 * Create a new upload operation
 */
export async function createUploadOperation(
  input: CreateUploadOperationInput
): Promise<UploadOperation> {
  return await prisma.uploadOperation.create({
    data: {
      filename: input.filename,
      fileType: input.fileType || '.csv',
      fileSize: input.fileSize,
      dataFormatId: input.dataFormatId,
      bankAccountId: input.bankAccountId,
      localFileLocation: input.localFileLocation,
      operationStatus: 'PENDING',
    },
    include: {
      bankAccount: true,
      dataFormat: true,
    },
  });
}

/**
 * Update an upload operation
 */
export async function updateUploadOperation(
  id: string,
  input: UpdateUploadOperationInput
): Promise<UploadOperation> {
  return await prisma.uploadOperation.update({
    where: { id },
    data: input,
    include: {
      bankAccount: true,
      dataFormat: true,
    },
  });
}

/**
 * Delete an upload operation
 */
export async function deleteUploadOperation(id: string): Promise<UploadOperation> {
  return await prisma.uploadOperation.delete({
    where: { id },
  });
}

/**
 * Get upload operation statistics
 */
export async function getUploadOperationStats() {
  const [total, byStatus] = await Promise.all([
    prisma.uploadOperation.count(),
    prisma.uploadOperation.groupBy({
      by: ['operationStatus'],
      _count: {
        operationStatus: true,
      },
    }),
  ]);

  return {
    total,
    byStatus: byStatus.reduce(
      (acc, item) => {
        acc[item.operationStatus] = item._count.operationStatus;
        return acc;
      },
      {} as Record<UploadOperationStatus, number>
    ),
  };
}
