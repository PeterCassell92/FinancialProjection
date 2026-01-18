import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateManyTransactionRecords, UpdateTransactionRecordInput } from '@/lib/dal/transaction-records';
import { ApiResponse } from '@/types';

/**
 * Zod schema for mass update transaction records request
 */
const massUpdateSchema = z.object({
  transactionIds: z.array(z.string()).min(1, 'At least one transaction ID is required'),
  notes: z.string().optional(),
  spendingTypeIds: z.array(z.string()).optional(),
});

/**
 * Response data for mass update
 */
interface MassUpdateResponseData {
  updatedCount: number;
}

type MassUpdateResponse = ApiResponse<MassUpdateResponseData>;

/**
 * PATCH /api/transaction-records/mass-update
 * Update multiple transaction records at once with the same notes and/or spending types
 *
 * Request body:
 * {
 *   transactionIds: string[];  // Array of transaction record IDs to update
 *   notes?: string;            // Optional: Notes to add to all transactions
 *   spendingTypeIds?: string[]; // Optional: Spending type IDs to assign to all transactions
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = massUpdateSchema.safeParse(body);
    if (!validation.success) {
      const response: MassUpdateResponse = {
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid request body',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { transactionIds, notes, spendingTypeIds } = validation.data;

    // Build update input
    const updateData: Partial<UpdateTransactionRecordInput> = {};
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (spendingTypeIds !== undefined) {
      updateData.spendingTypeIds = spendingTypeIds;
    }

    // Ensure at least one field to update
    if (Object.keys(updateData).length === 0) {
      const response: MassUpdateResponse = {
        success: false,
        error: 'At least one field (notes or spendingTypeIds) must be provided',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Perform mass update
    const updatedCount = await updateManyTransactionRecords(transactionIds, updateData);

    const response: MassUpdateResponse = {
      success: true,
      data: {
        updatedCount,
      },
      message: `Successfully updated ${updatedCount} transaction${updatedCount === 1 ? '' : 's'}`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Mass update transaction records error:', error);

    const response: MassUpdateResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mass update transaction records',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
