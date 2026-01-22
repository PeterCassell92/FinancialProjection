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
 *
 * Query Parameters:
 * - bankAccountId (optional): UUID to filter by bank account
 * - formats (optional): 'true' to get data formats instead of operations
 * - format (optional): 'json' (default) or 'toon' (compact format)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId');
    const getFormats = searchParams.get('formats') === 'true';
    const responseFormat = searchParams.get('responseFormat') || 'json';

    // If requesting data formats
    if (getFormats) {
      const dataFormats = await getAllDataFormats();

      if (responseFormat === 'toon') {
        const toonData = dataFormats
          .map((df) => `${df.id}|${df.name}|${df.description || 'N/A'}`)
          .join('\n');
        return NextResponse.json({
          success: true,
          data: toonData,
        });
      }

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

    // Return TOON format if requested
    if (responseFormat === 'toon') {
      const toonData = uploadOperations
        .map((op) => {
          const date = new Date(op.createdAt).toISOString().split('T')[0];
          const status = op.operationStatus;
          const records = op.numberOfRecords || 0;
          const bankAcctName = op.bankAccount?.name || 'N/A';
          const formatName = op.dataFormat?.name || 'N/A';
          return `${op.id}|${date}|${status}|${records}|${bankAcctName}|${formatName}|${op.filename}`;
        })
        .join('\n');

      return NextResponse.json({
        success: true,
        data: toonData,
      });
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
