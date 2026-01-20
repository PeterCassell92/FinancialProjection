import { NextRequest, NextResponse } from 'next/server';
import {
  getCategorizationRuleById,
  CategorizationRuleWithSpendingTypes,
} from '@/lib/dal/categorization-rules';
import prisma from '@/lib/prisma';

/**
 * POST /api/categorization-rules/[id]/apply
 * Apply a categorization rule to existing transactions for a specific bank account
 *
 * Body:
 * {
 *   bankAccountId: string;
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    if (!body.bankAccountId || typeof body.bankAccountId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid required field: bankAccountId',
        },
        { status: 400 }
      );
    }

    // Get the categorization rule
    const rule = await getCategorizationRuleById(id);

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Categorization rule not found',
        },
        { status: 404 }
      );
    }

    // Get all transactions for the bank account
    const transactions = await prisma.transactionRecord.findMany({
      where: {
        bankAccountId: body.bankAccountId,
      },
      include: {
        spendingTypes: {
          select: {
            spendingTypeId: true,
          },
        },
      },
    });

    // Filter transactions that match the rule
    const matchingTransactions = transactions.filter((transaction) => {
      if (rule.exactMatch) {
        // Exact match: case-insensitive comparison
        return (
          transaction.transactionDescription.toLowerCase() ===
          rule.descriptionString.toLowerCase()
        );
      } else {
        // Partial match: case-insensitive contains
        return transaction.transactionDescription
          .toLowerCase()
          .includes(rule.descriptionString.toLowerCase());
      }
    });

    // For each matching transaction, add the spending types (if not already present)
    let transactionsUpdated = 0;
    const spendingTypeAssociations: Array<{
      transactionRecordId: string;
      spendingTypeId: string;
      categorizationRuleId: string;
      appliedManually: boolean;
    }> = [];

    for (const transaction of matchingTransactions) {
      // Get existing spending type IDs for this transaction
      const existingSpendingTypeIds = new Set(
        transaction.spendingTypes.map((st) => st.spendingTypeId)
      );

      // Add associations for spending types that aren't already present
      let hasNewAssociations = false;
      for (const ruleSpendingType of rule.spendingTypes) {
        if (!existingSpendingTypeIds.has(ruleSpendingType.spendingTypeId)) {
          spendingTypeAssociations.push({
            transactionRecordId: transaction.id,
            spendingTypeId: ruleSpendingType.spendingTypeId,
            categorizationRuleId: rule.id, // Track which rule applied this
            appliedManually: false, // Applied by rule, not manually
          });
          hasNewAssociations = true;
        }
      }

      if (hasNewAssociations) {
        transactionsUpdated++;
      }
    }

    // Bulk insert the new spending type associations
    if (spendingTypeAssociations.length > 0) {
      await prisma.transactionSpendingType.createMany({
        data: spendingTypeAssociations,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionsMatched: matchingTransactions.length,
        transactionsUpdated,
        spendingTypesAdded: spendingTypeAssociations.length,
      },
      message: `Applied rule to ${transactionsUpdated} transaction(s)`,
    });
  } catch (error: any) {
    console.error('Error applying categorization rule:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Categorization rule not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply categorization rule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
