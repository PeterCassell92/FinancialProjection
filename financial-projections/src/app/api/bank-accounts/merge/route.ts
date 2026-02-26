import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const mergeSchema = z.object({
  fromBankAccountId: z.string(),
  toBankAccountId: z.string(),
  deleteSourceAccount: z.boolean().optional().default(true),
});

/**
 * POST /api/bank-accounts/merge
 * Merge one bank account into another by moving all associated data
 */
export const { POST } = defineRoute({
  operationId: 'mergeBankAccounts',
  method: 'POST',
  summary: 'Merge bank accounts',
  description: 'Merge one bank account into another by moving all associated data (transactions, projection events, recurring rules, daily balances, upload operations)',
  tags: ['Bank Accounts'],
  requestBody: mergeSchema,
  action: async ({ body }) => {
    try {
      const { fromBankAccountId, toBankAccountId, deleteSourceAccount } = body;

      // Verify both accounts exist
      const [fromAccount, toAccount] = await Promise.all([
        prisma.bankAccount.findUnique({ where: { id: fromBankAccountId } }),
        prisma.bankAccount.findUnique({ where: { id: toBankAccountId } }),
      ]);

      if (!fromAccount) {
        return Response.json(
          {
            success: false,
            error: `Source bank account not found: ${fromBankAccountId}`,
          },
          { status: 404 }
        );
      }

      if (!toAccount) {
        return Response.json(
          {
            success: false,
            error: `Target bank account not found: ${toBankAccountId}`,
          },
          { status: 404 }
        );
      }

      // Cannot merge into itself
      if (fromBankAccountId === toBankAccountId) {
        return Response.json(
          {
            success: false,
            error: 'Cannot merge a bank account into itself',
          },
          { status: 400 }
        );
      }

      const results = await prisma.$transaction(async (tx) => {
        // Move transaction records
        const transactionResult = await tx.transactionRecord.updateMany({
          where: { bankAccountId: fromBankAccountId },
          data: { bankAccountId: toBankAccountId },
        });

        // Move projection events
        const projectionEventResult = await tx.projectionEvent.updateMany({
          where: { bankAccountId: fromBankAccountId },
          data: { bankAccountId: toBankAccountId },
        });

        // Move recurring event rules
        const recurringRuleResult = await tx.recurringProjectionEventRule.updateMany({
          where: { bankAccountId: fromBankAccountId },
          data: { bankAccountId: toBankAccountId },
        });

        // Move daily balances
        const dailyBalanceResult = await tx.dailyBalance.updateMany({
          where: { bankAccountId: fromBankAccountId },
          data: { bankAccountId: toBankAccountId },
        });

        // Move upload operations
        const uploadOperationResult = await tx.uploadOperation.updateMany({
          where: { bankAccountId: fromBankAccountId },
          data: { bankAccountId: toBankAccountId },
        });

        // Delete source account if requested
        if (deleteSourceAccount) {
          await tx.bankAccount.delete({
            where: { id: fromBankAccountId },
          });
        }

        return {
          transactionsMoved: transactionResult.count,
          projectionEventsMoved: projectionEventResult.count,
          recurringRulesMoved: recurringRuleResult.count,
          dailyBalancesMoved: dailyBalanceResult.count,
          uploadOperationsMoved: uploadOperationResult.count,
          sourceAccountDeleted: deleteSourceAccount,
        };
      });

      return Response.json(
        {
          success: true,
          data: {
            ...results,
            fromAccount: fromAccount.name,
            toAccount: toAccount.name,
          },
          message: `Successfully merged "${fromAccount.name}" into "${toAccount.name}"`,
        },
        { status: 200 }
      );
    } catch (error: unknown) {
      console.error('Merge bank accounts error:', error);
      return Response.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to merge bank accounts',
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: { description: 'Bank accounts merged successfully' },
    400: { description: 'Invalid request body or cannot merge account into itself' },
    404: { description: 'Source or target bank account not found' },
    500: { description: 'Server error' },
  },
});
