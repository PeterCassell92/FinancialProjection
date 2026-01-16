import { NextRequest, NextResponse } from 'next/server';
import {
  getAllUploadOperations,
  getUploadOperationsByBankAccount,
  getAllDataFormats,
} from '@/lib/dal/upload-operations';
import { ApiResponse } from '@/types';

/**
 * GET /api/upload-operations
 * Get upload operations, optionally filtered by bank account
 * Also supports getting data formats
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId');
    const getFormats = searchParams.get('formats') === 'true';

    // If requesting data formats
    if (getFormats) {
      const dataFormats = await getAllDataFormats();
      const response: ApiResponse = {
        success: true,
        data: dataFormats,
      };
      return NextResponse.json(response);
    }

    // Get upload operations
    let uploadOperations;
    if (bankAccountId) {
      uploadOperations = await getUploadOperationsByBankAccount(bankAccountId);
    } else {
      uploadOperations = await getAllUploadOperations();
    }

    const response: ApiResponse = {
      success: true,
      data: uploadOperations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching upload operations:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch upload operations',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
