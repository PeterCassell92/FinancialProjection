import { NextRequest, NextResponse } from 'next/server';
import {
  getBankAccountById,
  updateBankAccount,
  deleteBankAccount,
  deleteBankAccountAndAllAssociatedRecords,
  UpdateBankAccountInput,
} from '@/lib/dal/bank-accounts';
import {
  BankAccountGetResponse,
  BankAccountUpdateRequestSchema,
  BankAccountUpdateResponse,
  BankAccountDeleteResponse,
} from '@/lib/schemas';

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
      const response: BankAccountGetResponse = {
        success: false,
        error: 'Bank account not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Serialize the data
    const serializedData = {
      id: bankAccount.id,
      name: bankAccount.name,
      description: bankAccount.description,
      sortCode: bankAccount.sortCode,
      accountNumber: bankAccount.accountNumber,
      provider: bankAccount.provider,
      createdAt: bankAccount.createdAt.toISOString(),
      updatedAt: bankAccount.updatedAt.toISOString(),
    };

    const response: BankAccountGetResponse = {
      success: true,
      data: serializedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching bank account:', error);
    const response: BankAccountGetResponse = {
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

    // Validate request body with Zod
    const validation = BankAccountUpdateRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: BankAccountUpdateResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;
    const input: UpdateBankAccountInput = {
      name: validatedData.name,
      description: validatedData.description ?? undefined,
      provider: validatedData.provider,
    };

    const bankAccount = await updateBankAccount(id, input);

    // Serialize the response
    const serializedData = {
      id: bankAccount.id,
      name: bankAccount.name,
      description: bankAccount.description,
      sortCode: bankAccount.sortCode,
      accountNumber: bankAccount.accountNumber,
      provider: bankAccount.provider,
      createdAt: bankAccount.createdAt.toISOString(),
      updatedAt: bankAccount.updatedAt.toISOString(),
    };

    const response: BankAccountUpdateResponse = {
      success: true,
      data: serializedData,
      message: 'Bank account updated successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating bank account:', error);

    if (error.code === 'P2025') {
      const response: BankAccountUpdateResponse = {
        success: false,
        error: 'Bank account not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: BankAccountUpdateResponse = {
      success: false,
      error: 'Failed to update bank account',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/bank-accounts/[id]
 * Delete a bank account
 *
 * Query params:
 * - deleteAll=true: Delete the bank account AND all associated records
 *   (transactions, projection events, recurring rules, daily balances, upload operations)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (deleteAll) {
      // Delete bank account and all associated records
      const transactionCount = await deleteBankAccountAndAllAssociatedRecords(id);

      const response: BankAccountDeleteResponse = {
        success: true,
        message: `Bank account and all associated records deleted successfully (${transactionCount} transactions)`,
      };

      return NextResponse.json(response);
    } else {
      // Delete only the bank account (will fail if there are related records)
      await deleteBankAccount(id);

      const response: BankAccountDeleteResponse = {
        success: true,
        message: 'Bank account deleted successfully',
      };

      return NextResponse.json(response);
    }
  } catch (error: any) {
    console.error('Error deleting bank account:', error);

    if (error.code === 'P2025') {
      const response: BankAccountDeleteResponse = {
        success: false,
        error: 'Bank account not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check for foreign key constraint violation
    if (error.code === 'P2003') {
      const response: BankAccountDeleteResponse = {
        success: false,
        error: 'Cannot delete bank account with existing transactions or events. Use deleteAll=true to delete all associated records.',
      };
      return NextResponse.json(response, { status: 409 });
    }

    const response: BankAccountDeleteResponse = {
      success: false,
      error: 'Failed to delete bank account',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
