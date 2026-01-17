import { prisma } from '@/lib/prisma';

export interface CreateDailyBalanceInput {
  date: Date;
  bankAccountId: string;
  expectedBalance: number;
  actualBalance?: number;
}

export interface UpdateDailyBalanceInput {
  expectedBalance?: number;
  actualBalance?: number;
}

/**
 * Get daily balance for a specific date and bank account
 */
export async function getDailyBalance(date: Date, bankAccountId: string) {
  return await prisma.dailyBalance.findUnique({
    where: {
      date_bankAccountId: {
        date,
        bankAccountId,
      },
    },
  });
}

/**
 * Get daily balances for a date range and bank account
 */
export async function getDailyBalances(
  startDate: Date,
  endDate: Date,
  bankAccountId?: string
) {
  return await prisma.dailyBalance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...(bankAccountId && { bankAccountId }),
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
      bankAccountId: input.bankAccountId,
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
    where: {
      date_bankAccountId: {
        date: input.date,
        bankAccountId: input.bankAccountId,
      },
    },
    create: {
      date: input.date,
      bankAccountId: input.bankAccountId,
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
  bankAccountId: string,
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
    where: {
      date_bankAccountId: {
        date,
        bankAccountId,
      },
    },
    data,
  });
}

/**
 * Set actual balance for a specific date and bank account
 */
export async function setActualBalance(
  date: Date,
  bankAccountId: string,
  actualBalance: number
) {
  return await prisma.dailyBalance.upsert({
    where: {
      date_bankAccountId: {
        date,
        bankAccountId,
      },
    },
    create: {
      date,
      bankAccountId,
      expectedBalance: 0, // Will be recalculated
      actualBalance,
    },
    update: {
      actualBalance,
    },
  });
}

/**
 * Clear actual balance for a specific date and bank account
 */
export async function clearActualBalance(date: Date, bankAccountId: string) {
  return await prisma.dailyBalance.update({
    where: {
      date_bankAccountId: {
        date,
        bankAccountId,
      },
    },
    data: {
      actualBalance: null,
    },
  });
}

/**
 * Delete daily balance record
 */
export async function deleteDailyBalance(date: Date, bankAccountId: string) {
  return await prisma.dailyBalance.delete({
    where: {
      date_bankAccountId: {
        date,
        bankAccountId,
      },
    },
  });
}

/**
 * Delete all daily balances in a date range for a specific bank account
 */
export async function deleteDailyBalancesInRange(
  startDate: Date,
  endDate: Date,
  bankAccountId?: string
) {
  return await prisma.dailyBalance.deleteMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...(bankAccountId && { bankAccountId }),
    },
  });
}

/**
 * Get the most recent actual balance before a given date for a specific bank account
 */
export async function getMostRecentActualBalance(
  beforeDate: Date,
  bankAccountId?: string
) {
  return await prisma.dailyBalance.findFirst({
    where: {
      date: {
        lt: beforeDate,
      },
      actualBalance: {
        not: null,
      },
      ...(bankAccountId && { bankAccountId }),
    },
    orderBy: {
      date: 'desc',
    },
  });
}

/**
 * Get the most recent actual balance on or before a given date for a specific bank account
 */
export async function getMostRecentActualBalanceOnOrBefore(
  onOrBeforeDate: Date,
  bankAccountId?: string
) {
  return await prisma.dailyBalance.findFirst({
    where: {
      date: {
        lte: onOrBeforeDate,
      },
      actualBalance: {
        not: null,
      },
      ...(bankAccountId && { bankAccountId }),
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
