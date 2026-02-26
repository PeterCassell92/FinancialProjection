import defineRoute from '@omer-x/next-openapi-route-handler';
import {
  getOrCreateSettings,
  getSettings,
  createSettings,
  updateSettings,
} from '@/lib/dal/settings';
import { setActualBalance } from '@/lib/dal/daily-balance';
import {
  SettingsGetResponseSchema,
  SettingsPutRequestSchema,
  SettingsPutResponseSchema,
  SettingsPatchRequestSchema,
  SettingsPatchResponseSchema,
} from '@/lib/schemas';
import { startOfDay } from 'date-fns';
import { Currency, DateFormat } from '@prisma/client';

/**
 * GET /api/settings
 * Get current settings (or create empty settings for first-time users)
 */
export const { GET } = defineRoute({
  operationId: 'getSettings',
  method: 'GET',
  summary: 'Get current settings',
  description: 'Get current settings or create empty settings for first-time users',
  tags: ['Settings'],
  action: async () => {
    try {
      let settings = await getSettings();

      // If no settings exist, create a record with null balance (first-time user)
      if (!settings) {
        await createSettings(0); // This creates with today's date as initialBalanceDate
        settings = await getSettings(); // Fetch again to get the full object with includes
      }

      // At this point settings should exist
      if (!settings) {
        return Response.json(
          { success: false, error: 'Settings not found' },
          { status: 404 }
        );
      }

      return Response.json({
        success: true,
        data: {
          id: settings.id,
          // Return null if balance is 0 (indicating not set by user)
          initialBankBalance: settings.initialBankBalance.toString() === '0' ? 0 : parseFloat(settings.initialBankBalance.toString()),
          initialBalanceDate: settings.initialBalanceDate.toISOString(),
          currency: settings.currency,
          dateFormat: settings.dateFormat,
          defaultBankAccountId: settings.defaultBankAccountId,
          createdAt: settings.createdAt.toISOString(),
          updatedAt: settings.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Settings retrieved successfully',
      content: SettingsGetResponseSchema,
    },
    404: { description: 'Settings not found' },
    500: { description: 'Server error' },
  },
});

/**
 * PUT /api/settings
 * Update settings and create/update the initial balance projection event
 */
export const { PUT } = defineRoute({
  operationId: 'updateSettings',
  method: 'PUT',
  summary: 'Update settings',
  description: 'Update settings and create/update the initial balance projection event',
  tags: ['Settings'],
  requestBody: SettingsPutRequestSchema,
  action: async ({ body }) => {
    try {
      // Parse optional date
      let balanceDate: Date | undefined;
      if (body.initialBalanceDate) {
        balanceDate = new Date(body.initialBalanceDate);
        if (isNaN(balanceDate.getTime())) {
          return Response.json(
            { success: false, error: 'initialBalanceDate must be a valid date' },
            { status: 400 }
          );
        }
      }

      // Default to today if no date provided
      const effectiveDate = balanceDate || startOfDay(new Date());

      // Update settings
      const currentSettings = await getOrCreateSettings();
      if (!currentSettings) {
        return Response.json(
          { success: false, error: 'Settings not found' },
          { status: 404 }
        );
      }

      const updatedSettings = await updateSettings(
        currentSettings.id,
        {
          initialBankBalance: body.initialBankBalance,
          initialBalanceDate: effectiveDate,
          currency: body.currency as Currency | undefined,
          dateFormat: body.dateFormat as DateFormat | undefined,
          defaultBankAccountId: body.defaultBankAccountId ?? undefined,
        }
      );

      // Set the actual balance for the initial balance date
      if (updatedSettings.defaultBankAccountId) {
        await setActualBalance(
          effectiveDate,
          updatedSettings.defaultBankAccountId,
          body.initialBankBalance
        );
      }

      return Response.json({
        success: true,
        data: {
          id: updatedSettings.id,
          initialBankBalance: parseFloat(updatedSettings.initialBankBalance.toString()),
          initialBalanceDate: updatedSettings.initialBalanceDate.toISOString(),
          currency: updatedSettings.currency,
          dateFormat: updatedSettings.dateFormat,
          defaultBankAccountId: updatedSettings.defaultBankAccountId,
          createdAt: updatedSettings.createdAt.toISOString(),
          updatedAt: updatedSettings.updatedAt.toISOString(),
        },
        message: 'Settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return Response.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Settings updated successfully',
      content: SettingsPutResponseSchema,
    },
    400: { description: 'Invalid request body' },
    404: { description: 'Settings not found' },
    500: { description: 'Server error' },
  },
});

/**
 * PATCH /api/settings
 * Update currency and date format preferences
 */
export const { PATCH } = defineRoute({
  operationId: 'patchSettings',
  method: 'PATCH',
  summary: 'Partially update settings',
  description: 'Update currency and date format preferences',
  tags: ['Settings'],
  requestBody: SettingsPatchRequestSchema,
  action: async ({ body }) => {
    try {
      // Get current settings
      const currentSettings = await getOrCreateSettings();
      if (!currentSettings) {
        return Response.json(
          { success: false, error: 'Settings not found' },
          { status: 404 }
        );
      }

      // Update only the provided fields
      const updatedSettings = await updateSettings(currentSettings.id, {
        initialBankBalance: body.initialBankBalance,
        initialBalanceDate: body.initialBalanceDate ? new Date(body.initialBalanceDate) : undefined,
        currency: body.currency as Currency | undefined,
        dateFormat: body.dateFormat as DateFormat | undefined,
        defaultBankAccountId: body.defaultBankAccountId ?? undefined,
      });

      return Response.json({
        success: true,
        data: {
          id: updatedSettings.id,
          initialBankBalance: parseFloat(updatedSettings.initialBankBalance.toString()),
          initialBalanceDate: updatedSettings.initialBalanceDate.toISOString(),
          currency: updatedSettings.currency,
          dateFormat: updatedSettings.dateFormat,
          defaultBankAccountId: updatedSettings.defaultBankAccountId,
          createdAt: updatedSettings.createdAt.toISOString(),
          updatedAt: updatedSettings.updatedAt.toISOString(),
        },
        message: 'Settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return Response.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Settings partially updated successfully',
      content: SettingsPatchResponseSchema,
    },
    400: { description: 'Invalid request body' },
    404: { description: 'Settings not found' },
    500: { description: 'Server error' },
  },
});
