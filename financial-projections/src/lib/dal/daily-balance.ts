import { prisma } from '@/lib/prisma';

export interface CreateDailyBalanceInput {
  date: Date;
  expectedBalance: number;
  actualBalance?: number;
}

export interface UpdateDailyBalanceInput {
  expectedBalance?: number;
  actualBalance?: number;
}

/**
 * Get daily balance for a specific date
 */
export async function getDailyBalance(date: Date) {
  return await prisma.dailyBalance.findUnique({
    where: { date },
  });
}

/**
 * Get daily balances for a date range
 */
export async function getDailyBalances(startDate: Date, endDate: Date) {
  return await prisma.dailyBalance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
}

/**
 * Create a daily balance record
 */
export async function createDailyBalance(input: CreateDailyBalanceInput) {
  return await prisma.dailyBalance.create({
    data: {
      date: input.date,
      expectedBalance: input.expectedBalance,
      actualBalance: input.actualBalance ?? null,
    },
  });
}

/**
 * Upsert a daily balance (create if doesn't exist, update if exists)
 */
export async function upsertDailyBalance(input: CreateDailyBalanceInput) {
  return await prisma.dailyBalance.upsert({
    where: { date: input.date },
    create: {
      date: input.date,
      expectedBalance: input.expectedBalance,
      actualBalance: input.actualBalance ?? null,
    },
    update: {
      expectedBalance: input.expectedBalance,
      actualBalance: input.actualBalance ?? null,
    },
  });
}

/**
 * Update a daily balance
 */
export async function updateDailyBalance(
  date: Date,
  input: UpdateDailyBalanceInput
) {
  const data: any = {};

  if (input.expectedBalance !== undefined) {
    data.expectedBalance = input.expectedBalance;
  }

  if (input.actualBalance !== undefined) {
    data.actualBalance = input.actualBalance;
  } else if (input.actualBalance === null) {
    data.actualBalance = null;
  }

  return await prisma.dailyBalance.update({
    where: { date },
    data,
  });
}

/**
 * Set actual balance for a specific date
 */
export async function setActualBalance(date: Date, actualBalance: number) {
  return await prisma.dailyBalance.upsert({
    where: { date },
    create: {
      date,
      expectedBalance: 0, // Will be recalculated
      actualBalance,
    },
    update: {
      actualBalance,
    },
  });
}

/**
 * Clear actual balance for a specific date
 */
export async function clearActualBalance(date: Date) {
  return await prisma.dailyBalance.update({
    where: { date },
    data: {
      actualBalance: null,
    },
  });
}

/**
 * Delete daily balance record
 */
export async function deleteDailyBalance(date: Date) {
  return await prisma.dailyBalance.delete({
    where: { date },
  });
}

/**
 * Delete all daily balances in a date range
 */
export async function deleteDailyBalancesInRange(
  startDate: Date,
  endDate: Date
) {
  return await prisma.dailyBalance.deleteMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
}

/**
 * Get the most recent actual balance before a given date
 */
export async function getMostRecentActualBalance(beforeDate: Date) {
  return await prisma.dailyBalance.findFirst({
    where: {
      date: {
        lt: beforeDate,
      },
      actualBalance: {
        not: null,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });
}

/**
 * Get the most recent actual balance on or before a given date
 */
export async function getMostRecentActualBalanceOnOrBefore(onOrBeforeDate: Date) {
  return await prisma.dailyBalance.findFirst({
    where: {
      date: {
        lte: onOrBeforeDate,
      },
      actualBalance: {
        not: null,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });
}

/**
 * Batch upsert daily balances
 */
export async function batchUpsertDailyBalances(
  inputs: CreateDailyBalanceInput[]
) {
  const promises = inputs.map((input) => upsertDailyBalance(input));
  return await Promise.all(promises);
}
