import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getBankAccountById,
  updateBankAccount,
  deleteBankAccount,
  deleteBankAccountAndAllAssociatedRecords,
} from '@/lib/dal/bank-accounts';
import {
  BankAccountGetResponseSchema,
  BankAccountUpdateRequestSchema,
  BankAccountUpdateResponseSchema,
  BankAccountDeleteResponseSchema,
} from '@/lib/schemas';

const pathParams = z.object({
  id: z.string(),
});

/**
 * GET /api/bank-accounts/[id]
 * Get a specific bank account
 */
export const { GET } = defineRoute({
  operationId: 'getBankAccountById',
  method: 'GET',
  summary: 'Get a specific bank account',
  description: 'Retrieve a bank account by its ID',
  tags: ['Bank Accounts'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      const bankAccount = await getBankAccountById(id);

      if (!bankAccount) {
        return Response.json(
          { success: false, error: 'Bank account not found' },
          { status: 404 }
        );
      }

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

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching bank account:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch bank account' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Bank account retrieved successfully',
      content: BankAccountGetResponseSchema,
    },
    404: { description: 'Bank account not found' },
    500: { description: 'Server error' },
  },
});

/**
 * PATCH /api/bank-accounts/[id]
 * Update a bank account
 */
export const { PATCH } = defineRoute({
  operationId: 'updateBankAccount',
  method: 'PATCH',
  summary: 'Update a bank account',
  description: 'Partially update a bank account by its ID',
  tags: ['Bank Accounts'],
  pathParams,
  requestBody: BankAccountUpdateRequestSchema,
  action: async ({ pathParams: { id }, body }) => {
    try {
      // body is already validated by defineRoute via BankAccountUpdateRequestSchema
      const bankAccount = await updateBankAccount(id, {
        name: body.name,
        description: body.description ?? undefined,
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

      return Response.json({
        success: true,
        data: serializedData,
        message: 'Bank account updated successfully',
      });
    } catch (error: unknown) {
      console.error('Error updating bank account:', error);

      if (error instanceof Object && 'code' in error && error.code === 'P2025') {
        return Response.json(
          { success: false, error: 'Bank account not found' },
          { status: 404 }
        );
      }

      return Response.json(
        { success: false, error: 'Failed to update bank account' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Bank account updated successfully',
      content: BankAccountUpdateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    404: { description: 'Bank account not found' },
    500: { description: 'Server error' },
  },
});

/**
 * DELETE /api/bank-accounts/[id]
 * Delete a bank account
 */
export const { DELETE } = defineRoute({
  operationId: 'deleteBankAccount',
  method: 'DELETE',
  summary: 'Delete a bank account',
  description: 'Delete a bank account by ID. Without deleteAll, fails with 409 if the account has related records. With deleteAll=true, cascade-deletes all projection events, recurring rules, daily balances, upload operations, and transaction records for the account.',
  tags: ['Bank Accounts'],
  pathParams,
  queryParams: z.object({
    deleteAll: z.string().optional(),
  }),
  action: async ({ pathParams: { id }, queryParams }) => {
    try {
      const deleteAll = queryParams?.deleteAll === 'true';

      if (deleteAll) {
        const transactionCount = await deleteBankAccountAndAllAssociatedRecords(id);
        return Response.json({
          success: true,
          message: `Bank account and all associated records deleted successfully (${transactionCount} transactions)`,
        });
      } else {
        await deleteBankAccount(id);
        return Response.json({
          success: true,
          message: 'Bank account deleted successfully',
        });
      }
    } catch (error: unknown) {
      console.error('Error deleting bank account:', error);
      const errCode = error instanceof Object && 'code' in error ? (error as { code: string }).code : null;

      if (errCode === 'P2025') {
        return Response.json(
          { success: false, error: 'Bank account not found' },
          { status: 404 }
        );
      }

      if (errCode === 'P2003') {
        return Response.json(
          {
            success: false,
            error: 'Cannot delete bank account with existing transactions or events. Use deleteAll=true to delete all associated records.',
          },
          { status: 409 }
        );
      }

      return Response.json(
        { success: false, error: 'Failed to delete bank account' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Bank account deleted successfully',
      content: BankAccountDeleteResponseSchema,
    },
    404: { description: 'Bank account not found' },
    409: { description: 'Bank account has associated records - use deleteAll=true' },
    500: { description: 'Server error' },
  },
});
