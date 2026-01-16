import prisma from '@/lib/prisma';
import { SpendingType } from '@prisma/client';

export interface CreateSpendingTypeInput {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateSpendingTypeInput {
  name?: string;
  description?: string;
  color?: string;
}

/**
 * Get all spending types
 */
export async function getAllSpendingTypes(): Promise<SpendingType[]> {
  return await prisma.spendingType.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Get a spending type by ID
 */
export async function getSpendingTypeById(id: string): Promise<SpendingType | null> {
  return await prisma.spendingType.findUnique({
    where: { id },
  });
}

/**
 * Get a spending type by name
 */
export async function getSpendingTypeByName(name: string): Promise<SpendingType | null> {
  return await prisma.spendingType.findUnique({
    where: { name },
  });
}

/**
 * Create a new spending type
 */
export async function createSpendingType(input: CreateSpendingTypeInput): Promise<SpendingType> {
  return await prisma.spendingType.create({
    data: input,
  });
}

/**
 * Get or create a spending type by name
 */
export async function getOrCreateSpendingType(
  name: string,
  description?: string,
  color?: string
): Promise<SpendingType> {
  const existing = await getSpendingTypeByName(name);
  if (existing) {
    return existing;
  }

  return await createSpendingType({
    name,
    description,
    color,
  });
}

/**
 * Update a spending type
 */
export async function updateSpendingType(
  id: string,
  input: UpdateSpendingTypeInput
): Promise<SpendingType> {
  return await prisma.spendingType.update({
    where: { id },
    data: input,
  });
}

/**
 * Delete a spending type
 */
export async function deleteSpendingType(id: string): Promise<SpendingType> {
  return await prisma.spendingType.delete({
    where: { id },
  });
}

/**
 * Get spending types with usage counts
 */
export async function getSpendingTypesWithCounts() {
  return await prisma.spendingType.findMany({
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}
