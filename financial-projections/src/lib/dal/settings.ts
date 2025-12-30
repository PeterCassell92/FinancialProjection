import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

/**
 * Get the current settings (there should only be one record)
 */
export async function getSettings() {
  return await prisma.settings.findFirst();
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
