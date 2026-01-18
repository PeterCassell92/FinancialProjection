import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types';

const mergeSchema = z.object({
  fromBankAccountId: z.string(),
  toBankAccountId: z.string(),
  deleteSourceAccount: z.boolean().optional().default(true),
});

/**
 * POST /api/bank-accounts/merge
 * Merge one bank account into another by moving all associated data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = mergeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0]?.message || 'Invalid request body',
        },
        { status: 400 }
      );
    }

    const { fromBankAccountId, toBankAccountId, deleteSourceAccount } = validation.data;

    // Verify both accounts exist
    const [fromAccount, toAccount] = await Promise.all([
      prisma.bankAccount.findUnique({ where: { id: fromBankAccountId } }),
      prisma.bankAccount.findUnique({ where: { id: toBankAccountId } }),
    ]);

    if (!fromAccount) {
      return NextResponse.json(
        {
          success: false,
          error: `Source bank account not found: ${fromBankAccountId}`,
        },
        { status: 404 }
      );
    }

    if (!toAccount) {
      return NextResponse.json(
        {
          success: false,
          error: `Target bank account not found: ${toBankAccountId}`,
        },
        { status: 404 }
      );
    }

    // Cannot merge into itself
    if (fromBankAccountId === toBankAccountId) {
      return NextResponse.json(
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

    return NextResponse.json(
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
  } catch (error) {
    console.error('Merge bank accounts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to merge bank accounts',
      },
      { status: 500 }
    );
  }
}
