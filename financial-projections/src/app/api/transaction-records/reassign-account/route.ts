import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types';

const reassignSchema = z.object({
  transactionIds: z.array(z.string()).optional(),
  fromBankAccountId: z.string().optional(),
  toBankAccountId: z.string(),
});

/**
 * PATCH /api/transaction-records/reassign-account
 * Reassign transactions from one bank account to another
 *
 * Either provide specific transactionIds OR fromBankAccountId to move all transactions
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = reassignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.message || 'Invalid request body',
        },
        { status: 400 }
      );
    }

    const { transactionIds, fromBankAccountId, toBankAccountId } = validation.data;

    // Must provide either transactionIds or fromBankAccountId
    if (!transactionIds && !fromBankAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Must provide either transactionIds or fromBankAccountId',
        },
        { status: 400 }
      );
    }

    // Verify target bank account exists
    const targetAccount = await prisma.bankAccount.findUnique({
      where: { id: toBankAccountId },
    });

    if (!targetAccount) {
      return NextResponse.json(
        {
          success: false,
          error: `Target bank account not found: ${toBankAccountId}`,
        },
        { status: 404 }
      );
    }

    // Build the where clause
    const whereClause: any = {};
    if (transactionIds) {
      whereClause.id = { in: transactionIds };
    } else if (fromBankAccountId) {
      whereClause.bankAccountId = fromBankAccountId;
    }

    // Update transactions
    const result = await prisma.transactionRecord.updateMany({
      where: whereClause,
      data: {
        bankAccountId: toBankAccountId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          updatedCount: result.count,
          toBankAccountName: targetAccount.name,
        },
        message: `Successfully reassigned ${result.count} transaction${result.count === 1 ? '' : 's'} to ${targetAccount.name}`,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Reassign transactions error:', error);

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: Record not found
      if (error.code === 'P2025') {
        return NextResponse.json(
          {
            success: false,
            error: 'One or more transactions or bank account not found',
          },
          { status: 404 }
        );
      }
      // P2003: Foreign key constraint violation
      if (error.code === 'P2003') {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid bank account reference',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reassign transactions',
      },
      { status: 500 }
    );
  }
}
