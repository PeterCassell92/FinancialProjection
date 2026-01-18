import { NextRequest, NextResponse } from 'next/server';
import {
  getAllBankAccounts,
  getBankAccountsWithCounts,
  createBankAccount,
  CreateBankAccountInput,
} from '@/lib/dal/bank-accounts';
import {
  BankAccountsGetResponse,
  BankAccountCreateRequestSchema,
  BankAccountCreateResponse,
} from '@/lib/schemas';

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

    // Serialize the data
    const serializedData = bankAccounts.map(ba => ({
      id: ba.id,
      name: ba.name,
      description: ba.description,
      sortCode: ba.sortCode,
      accountNumber: ba.accountNumber,
      provider: ba.provider,
      createdAt: ba.createdAt.toISOString(),
      updatedAt: ba.updatedAt.toISOString(),
    }));

    const response: BankAccountsGetResponse = {
      success: true,
      data: serializedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    const response: BankAccountsGetResponse = {
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

    // Validate request body with Zod
    const validation = BankAccountCreateRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: BankAccountCreateResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;
    const input: CreateBankAccountInput = {
      name: validatedData.name,
      description: validatedData.description,
      sortCode: validatedData.sortCode,
      accountNumber: validatedData.accountNumber,
      provider: validatedData.provider,
    };

    const bankAccount = await createBankAccount(input);

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

    const response: BankAccountCreateResponse = {
      success: true,
      data: serializedData,
      message: 'Bank account created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating bank account:', error);

    // Check for unique constraint violation
    if (error.code === 'P2002') {
      const response: BankAccountCreateResponse = {
        success: false,
        error: 'Bank account with this sort code and account number already exists',
      };
      return NextResponse.json(response, { status: 409 });
    }

    const response: BankAccountCreateResponse = {
      success: false,
      error: 'Failed to create bank account',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
