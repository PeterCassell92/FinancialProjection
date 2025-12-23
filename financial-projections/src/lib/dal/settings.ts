import { prisma } from '@/lib/prisma';

/**
 * Get the current settings (there should only be one record)
 */
export async function getSettings() {
  return await prisma.settings.findFirst();
}

/**
 * Create initial settings with starting bank balance
 */
export async function createSettings(initialBankBalance: number) {
  return await prisma.settings.create({
    data: {
      initialBankBalance,
    },
  });
}

/**
 * Update the initial bank balance
 */
export async function updateInitialBankBalance(
  settingsId: string,
  newBalance: number
) {
  return await prisma.settings.update({
    where: { id: settingsId },
    data: {
      initialBankBalance: newBalance,
    },
  });
}

/**
 * Get or create settings (ensures settings always exist)
 */
export async function getOrCreateSettings(defaultInitialBalance = 0) {
  let settings = await getSettings();

  if (!settings) {
    settings = await createSettings(defaultInitialBalance);
  }

  return settings;
}
