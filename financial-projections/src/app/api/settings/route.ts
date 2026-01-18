import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateSettings,
  getSettings,
  updateInitialBankBalance,
  createSettings,
  updateSettings,
} from '@/lib/dal/settings';
import { setActualBalance } from '@/lib/dal/daily-balance';
import {
  SettingsGetResponse,
  SettingsPutRequestSchema,
  SettingsPutResponse,
  SettingsPatchRequestSchema,
  SettingsPatchResponse,
} from '@/lib/schemas';
import { startOfDay } from 'date-fns';
import { Currency, DateFormat } from '@prisma/client';

/**
 * GET /api/settings
 * Get current settings (or create empty settings for first-time users)
 */
export async function GET() {
  try {
    let settings = await getSettings();

    // If no settings exist, create a record with null balance (first-time user)
    if (!settings) {
      await createSettings(0); // This creates with today's date as initialBalanceDate
      settings = await getSettings(); // Fetch again to get the full object with includes
    }

    // At this point settings should exist
    if (!settings) {
      const response: SettingsGetResponse = {
        success: false,
        error: 'Failed to create settings',
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: SettingsGetResponse = {
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching settings:', error);
    const response: SettingsGetResponse = {
      success: false,
      error: 'Failed to fetch settings',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/settings
 * Update settings and create/update the initial balance projection event
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validation = SettingsPutRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: SettingsPutResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;

    // Parse optional date
    let balanceDate: Date | undefined;
    if (validatedData.initialBalanceDate) {
      balanceDate = new Date(validatedData.initialBalanceDate);
      if (isNaN(balanceDate.getTime())) {
        const response: SettingsPutResponse = {
          success: false,
          error: 'initialBalanceDate must be a valid date',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Default to today if no date provided
    const effectiveDate = balanceDate || startOfDay(new Date());

    // Update settings
    const currentSettings = await getOrCreateSettings();
    if (!currentSettings) {
      const response: SettingsPutResponse = {
        success: false,
        error: 'Failed to get or create settings',
      };
      return NextResponse.json(response, { status: 500 });
    }

    const updatedSettings = await updateSettings(
      currentSettings.id,
      {
        initialBankBalance: validatedData.initialBankBalance,
        initialBalanceDate: effectiveDate,
        currency: validatedData.currency as Currency | undefined,
        dateFormat: validatedData.dateFormat as DateFormat | undefined,
        defaultBankAccountId: validatedData.defaultBankAccountId ?? undefined,
      }
    );

    // Set the actual balance for the initial balance date
    // This creates or updates the daily balance entry with the actual balance
    // Use the default bank account ID from the updated settings
    if (updatedSettings.defaultBankAccountId) {
      await setActualBalance(
        effectiveDate,
        updatedSettings.defaultBankAccountId,
        validatedData.initialBankBalance
      );
    }

    const response: SettingsPutResponse = {
      success: true,
      data: {
        id: updatedSettings.id,
        initialBankBalance: parseFloat(
          updatedSettings.initialBankBalance.toString()
        ),
        initialBalanceDate: updatedSettings.initialBalanceDate.toISOString(),
        currency: updatedSettings.currency,
        dateFormat: updatedSettings.dateFormat,
        defaultBankAccountId: updatedSettings.defaultBankAccountId,
        createdAt: updatedSettings.createdAt.toISOString(),
        updatedAt: updatedSettings.updatedAt.toISOString(),
      },
      message: 'Settings updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating settings:', error);
    const response: SettingsPutResponse = {
      success: false,
      error: 'Failed to update settings',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/settings
 * Update currency and date format preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validation = SettingsPatchRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: SettingsPatchResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;

    // Get current settings
    const currentSettings = await getOrCreateSettings();
    if (!currentSettings) {
      const response: SettingsPatchResponse = {
        success: false,
        error: 'Failed to get or create settings',
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Update only the provided fields
    const updatedSettings = await updateSettings(currentSettings.id, {
      initialBankBalance: validatedData.initialBankBalance,
      initialBalanceDate: validatedData.initialBalanceDate ? new Date(validatedData.initialBalanceDate) : undefined,
      currency: validatedData.currency as Currency | undefined,
      dateFormat: validatedData.dateFormat as DateFormat | undefined,
      defaultBankAccountId: validatedData.defaultBankAccountId ?? undefined,
    });

    const response: SettingsPatchResponse = {
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating settings:', error);
    const response: SettingsPatchResponse = {
      success: false,
      error: 'Failed to update settings',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
