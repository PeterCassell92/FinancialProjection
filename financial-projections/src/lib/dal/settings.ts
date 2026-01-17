import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';
import { Currency, DateFormat } from '@prisma/client';

/**
 * Get the current settings (there should only be one record)
 */
export async function getSettings() {
  return await prisma.settings.findFirst({
    include: {
      defaultBankAccount: true,
    },
  });
}

/**
 * Create initial settings with starting bank balance
 */
export async function createSettings(
  initialBankBalance: number,
  initialBalanceDate?: Date
) {
  return await prisma.settings.create({
    data: {
      initialBankBalance,
      initialBalanceDate: startOfDay(initialBalanceDate || new Date()),
    },
  });
}

/**
 * Update the initial bank balance and optionally the date
 */
export async function updateInitialBankBalance(
  settingsId: string,
  newBalance: number,
  newBalanceDate?: Date
) {
  const updateData: Partial<{
    initialBankBalance: number;
    initialBalanceDate: Date;
  }> = {
    initialBankBalance: newBalance,
  };

  if (newBalanceDate) {
    updateData.initialBalanceDate = startOfDay(newBalanceDate);
  }

  return await prisma.settings.update({
    where: { id: settingsId },
    data: updateData,
  });
}

/**
 * Update settings (currency, dateFormat, defaultBankAccountId, etc.)
 */
export async function updateSettings(
  settingsId: string,
  updates: {
    initialBankBalance?: number;
    initialBalanceDate?: Date;
    currency?: Currency;
    dateFormat?: DateFormat;
    defaultBankAccountId?: string;
  }
) {
  const updateData: any = {};

  if (updates.initialBankBalance !== undefined) {
    updateData.initialBankBalance = updates.initialBankBalance;
  }

  if (updates.initialBalanceDate !== undefined) {
    updateData.initialBalanceDate = startOfDay(updates.initialBalanceDate);
  }

  if (updates.currency !== undefined) {
    updateData.currency = updates.currency;
  }

  if (updates.dateFormat !== undefined) {
    updateData.dateFormat = updates.dateFormat;
  }

  if (updates.defaultBankAccountId !== undefined) {
    updateData.defaultBankAccountId = updates.defaultBankAccountId;
  }

  return await prisma.settings.update({
    where: { id: settingsId },
    data: updateData,
    include: {
      defaultBankAccount: true,
    },
  });
}

/**
 * Get or create settings (ensures settings always exist)
 */
export async function getOrCreateSettings(
  defaultInitialBalance = 0,
  defaultInitialBalanceDate?: Date
) {
  let settings = await getSettings();

  if (!settings) {
    settings = await createSettings(
      defaultInitialBalance,
      defaultInitialBalanceDate
    );
  }

  return settings;
}
