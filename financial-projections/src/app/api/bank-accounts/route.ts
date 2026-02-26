import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getAllBankAccounts,
  getBankAccountsWithCounts,
  createBankAccount,
} from '@/lib/dal/bank-accounts';
import {
  BankAccountsGetResponseSchema,
  BankAccountCreateRequestSchema,
  BankAccountCreateResponseSchema,
} from '@/lib/schemas';

/**
 * GET /api/bank-accounts
 * Get all bank accounts, optionally with usage counts
 */
export const { GET } = defineRoute({
  operationId: 'getBankAccounts',
  method: 'GET',
  summary: 'Get all bank accounts',
  description: 'Get all bank accounts, optionally with usage counts',
  tags: ['Bank Accounts'],
  queryParams: z.object({
    includeCounts: z.string().optional(),
  }),
  action: async ({ queryParams }) => {
    try {
      const includeCounts = queryParams?.includeCounts === 'true';

      let bankAccounts;
      if (includeCounts) {
        bankAccounts = await getBankAccountsWithCounts();
      } else {
        bankAccounts = await getAllBankAccounts();
      }

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

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch bank accounts' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'List of bank accounts retrieved successfully',
      content: BankAccountsGetResponseSchema,
    },
    500: { description: 'Server error' },
  },
});

/**
 * POST /api/bank-accounts
 * Create a new bank account
 */
export const { POST } = defineRoute({
  operationId: 'createBankAccount',
  method: 'POST',
  summary: 'Create a new bank account',
  description: 'Create a new bank account with name, sort code, account number, and provider',
  tags: ['Bank Accounts'],
  requestBody: BankAccountCreateRequestSchema,
  action: async ({ body }) => {
    try {
      // body is already validated by defineRoute via BankAccountCreateRequestSchema
      const bankAccount = await createBankAccount({
        name: body.name,
        description: body.description,
        sortCode: body.sortCode,
        accountNumber: body.accountNumber,
        provider: body.provider,
      });

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

      return Response.json(
        {
          success: true,
          data: serializedData,
          message: 'Bank account created successfully',
        },
        { status: 201 }
      );
    } catch (error: unknown) {
      console.error('Error creating bank account:', error);

      if (error instanceof Object && 'code' in error && error.code === 'P2002') {
        return Response.json(
          {
            success: false,
            error: 'Bank account with this sort code and account number already exists',
          },
          { status: 409 }
        );
      }

      return Response.json(
        { success: false, error: 'Failed to create bank account' },
        { status: 500 }
      );
    }
  },
  responses: {
    201: {
      description: 'Bank account created successfully',
      content: BankAccountCreateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    409: { description: 'Bank account with this sort code and account number already exists' },
    500: { description: 'Server error' },
  },
});
