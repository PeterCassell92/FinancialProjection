import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateSettings,
  getSettings,
  updateInitialBankBalance,
  createSettings,
} from '@/lib/dal/settings';
import { setActualBalance } from '@/lib/dal/daily-balance';
import { ApiResponse, UpdateSettingsRequest } from '@/types';
import { startOfDay } from 'date-fns';

/**
 * GET /api/settings
 * Get current settings (or create empty settings for first-time users)
 */
export async function GET() {
  try {
    let settings = await getSettings();

    // If no settings exist, create a record with null balance (first-time user)
    if (!settings) {
      settings = await createSettings(0); // This creates with today's date as initialBalanceDate
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: settings.id,
        // Return null if balance is 0 (indicating not set by user)
        initialBankBalance: settings.initialBankBalance.toString() === '0' ? null : parseFloat(settings.initialBankBalance.toString()),
        initialBalanceDate: settings.initialBalanceDate,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching settings:', error);
    const response: ApiResponse = {
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
    const body: UpdateSettingsRequest = await request.json();

    if (typeof body.initialBankBalance !== 'number') {
      const response: ApiResponse = {
        success: false,
        error: 'initialBankBalance must be a number',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Parse optional date
    let balanceDate: Date | undefined;
    if (body.initialBalanceDate) {
      balanceDate = new Date(body.initialBalanceDate);
      if (isNaN(balanceDate.getTime())) {
        const response: ApiResponse = {
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
    const updatedSettings = await updateInitialBankBalance(
      currentSettings.id,
      body.initialBankBalance,
      effectiveDate
    );

    // Set the actual balance for the initial balance date
    // This creates or updates the daily balance entry with the actual balance
    await setActualBalance(effectiveDate, body.initialBankBalance);

    const response: ApiResponse = {
      success: true,
      data: {
        id: updatedSettings.id,
        initialBankBalance: parseFloat(
          updatedSettings.initialBankBalance.toString()
        ),
        initialBalanceDate: updatedSettings.initialBalanceDate,
        createdAt: updatedSettings.createdAt,
        updatedAt: updatedSettings.updatedAt,
      },
      message: 'Settings updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating settings:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update settings',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
