import { NextRequest, NextResponse } from 'next/server';
import {
  getBankAccountById,
  updateBankAccount,
  deleteBankAccount,
  UpdateBankAccountInput,
} from '@/lib/dal/bank-accounts';
import { ApiResponse } from '@/types';
import { BankProvider } from '@prisma/client';

/**
 * GET /api/bank-accounts/[id]
 * Get a specific bank account
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bankAccount = await getBankAccountById(id);

    if (!bankAccount) {
      const response: ApiResponse = {
        success: false,
        error: 'Bank account not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: bankAccount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch bank account',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/bank-accounts/[id]
 * Update a bank account
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate provider if provided
    if (body.provider && !Object.values(BankProvider).includes(body.provider)) {
      const response: ApiResponse = {
        success: false,
        error: `Invalid provider. Must be one of: ${Object.values(BankProvider).join(', ')}`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const input: UpdateBankAccountInput = {
      name: body.name,
      description: body.description,
      provider: body.provider,
    };

    const bankAccount = await updateBankAccount(id, input);

    const response: ApiResponse = {
      success: true,
      data: bankAccount,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating bank account:', error);

    if (error.code === 'P2025') {
      const response: ApiResponse = {
        success: false,
        error: 'Bank account not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: false,
      error: 'Failed to update bank account',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/bank-accounts/[id]
 * Delete a bank account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteBankAccount(id);

    const response: ApiResponse = {
      success: true,
      message: 'Bank account deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error deleting bank account:', error);

    if (error.code === 'P2025') {
      const response: ApiResponse = {
        success: false,
        error: 'Bank account not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check for foreign key constraint violation
    if (error.code === 'P2003') {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot delete bank account with existing transactions or events',
      };
      return NextResponse.json(response, { status: 409 });
    }

    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete bank account',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
