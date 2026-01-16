import { NextRequest, NextResponse } from 'next/server';
import {
  getAllBankAccounts,
  getBankAccountsWithCounts,
  createBankAccount,
  CreateBankAccountInput,
} from '@/lib/dal/bank-accounts';
import { ApiResponse } from '@/types';
import { BankProvider } from '@prisma/client';

/**
 * GET /api/bank-accounts
 * Get all bank accounts, optionally with usage counts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeCounts = searchParams.get('includeCounts') === 'true';

    let bankAccounts;
    if (includeCounts) {
      bankAccounts = await getBankAccountsWithCounts();
    } else {
      bankAccounts = await getAllBankAccounts();
    }

    const response: ApiResponse = {
      success: true,
      data: bankAccounts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch bank accounts',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/bank-accounts
 * Create a new bank account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.sortCode || !body.accountNumber || !body.provider) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: name, sortCode, accountNumber, provider',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate provider enum
    if (!Object.values(BankProvider).includes(body.provider)) {
      const response: ApiResponse = {
        success: false,
        error: `Invalid provider. Must be one of: ${Object.values(BankProvider).join(', ')}`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const input: CreateBankAccountInput = {
      name: body.name,
      description: body.description,
      sortCode: body.sortCode,
      accountNumber: body.accountNumber,
      provider: body.provider,
    };

    const bankAccount = await createBankAccount(input);

    const response: ApiResponse = {
      success: true,
      data: bankAccount,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bank account:', error);

    // Check for unique constraint violation
    if (error.code === 'P2002') {
      const response: ApiResponse = {
        success: false,
        error: 'Bank account with this sort code and account number already exists',
      };
      return NextResponse.json(response, { status: 409 });
    }

    const response: ApiResponse = {
      success: false,
      error: 'Failed to create bank account',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
