import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateSettings,
  updateInitialBankBalance,
} from '@/lib/dal/settings';
import { ApiResponse, UpdateSettingsRequest } from '@/types';

/**
 * GET /api/settings
 * Get current settings
 */
export async function GET() {
  try {
    const settings = await getOrCreateSettings();

    const response: ApiResponse = {
      success: true,
      data: {
        id: settings.id,
        initialBankBalance: parseFloat(settings.initialBankBalance.toString()),
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
 * Update settings
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

    const currentSettings = await getOrCreateSettings();
    const updatedSettings = await updateInitialBankBalance(
      currentSettings.id,
      body.initialBankBalance,
      balanceDate
    );

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
