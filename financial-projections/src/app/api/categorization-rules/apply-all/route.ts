import { NextRequest, NextResponse } from 'next/server';
import { getAllCategorizationRules } from '@/lib/dal/categorization-rules';
import prisma from '@/lib/prisma';
import { startActivity, updateProgress, completeActivity, failActivity } from '@/lib/services/activity-log-service';

/**
 * POST /api/categorization-rules/apply-all
 * Apply all categorization rules to existing transactions for a specific bank account
 *
 * Body:
 * {
 *   bankAccountId: string;
 * }
 *
 * Returns:
 * {
 *   success: boolean;
 *   data?: {
 *     rulesProcessed: number;
 *     rulesSucceeded: number;
 *     rulesFailed: number;
 *     totalTransactionsUpdated: number;
 *     totalSpendingTypesAdded: number;
 *     results: Array<{
 *       ruleId: string;
 *       ruleDescription: string;
 *       success: boolean;
 *       transactionsUpdated?: number;
 *       error?: string;
 *     }>;
 *   };
 * }
 */
export async function POST(request: NextRequest) {
  let activity: Awaited<ReturnType<typeof startActivity>> | null = null;

  try {
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

    // Get all categorization rules
    const rules = await getAllCategorizationRules();

    if (rules.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No categorization rules found',
        },
        { status: 404 }
      );
    }

    // Start activity tracking
    activity = await startActivity('CATEGORIZATION_RULES_APPLIED_ALL', {
      entityType: 'BankAccount',
      entityId: body.bankAccountId,
      totalItems: rules.length,
      metadata: {
        bankAccountId: body.bankAccountId,
        totalRules: rules.length,
      },
    });

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

    let totalTransactionsUpdated = 0;
    let totalSpendingTypesAdded = 0;
    let rulesSucceeded = 0;
    let rulesFailed = 0;
    const results: Array<{
      ruleId: string;
      ruleDescription: string;
      success: boolean;
      transactionsUpdated?: number;
      spendingTypesAdded?: number;
      error?: string;
    }> = [];

    // Apply each rule
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      try {
        // Filter transactions that match this rule
        const matchingTransactions = transactions.filter((transaction) => {
          if (rule.exactMatch) {
            return (
              transaction.transactionDescription.toLowerCase() ===
              rule.descriptionString.toLowerCase()
            );
          } else {
            return transaction.transactionDescription
              .toLowerCase()
              .includes(rule.descriptionString.toLowerCase());
          }
        });

        // Collect spending type associations to add
        let ruleTransactionsUpdated = 0;
        let ruleSpendingTypesAdded = 0;
        const spendingTypeAssociations: Array<{
          transactionRecordId: string;
          spendingTypeId: string;
          categorizationRuleId: string;
          appliedManually: boolean;
        }> = [];

        for (const transaction of matchingTransactions) {
          const existingSpendingTypeIds = new Set(
            transaction.spendingTypes.map((st) => st.spendingTypeId)
          );

          let hasNewAssociations = false;
          for (const ruleSpendingType of rule.spendingTypes) {
            if (!existingSpendingTypeIds.has(ruleSpendingType.spendingTypeId)) {
              spendingTypeAssociations.push({
                transactionRecordId: transaction.id,
                spendingTypeId: ruleSpendingType.spendingTypeId,
                categorizationRuleId: rule.id,
                appliedManually: false,
              });
              hasNewAssociations = true;
              ruleSpendingTypesAdded++;
            }
          }

          if (hasNewAssociations) {
            ruleTransactionsUpdated++;
          }
        }

        // Bulk insert the new spending type associations
        if (spendingTypeAssociations.length > 0) {
          await prisma.transactionSpendingType.createMany({
            data: spendingTypeAssociations,
            skipDuplicates: true,
          });
        }

        totalTransactionsUpdated += ruleTransactionsUpdated;
        totalSpendingTypesAdded += ruleSpendingTypesAdded;
        rulesSucceeded++;

        results.push({
          ruleId: rule.id,
          ruleDescription: rule.descriptionString,
          success: true,
          transactionsUpdated: ruleTransactionsUpdated,
          spendingTypesAdded: ruleSpendingTypesAdded,
        });

        // Update progress
        if (activity) {
          await updateProgress(
            activity.id,
            i + 1,
            rules.length,
            `Processed ${i + 1} of ${rules.length} rules`
          );
        }
      } catch (error) {
        console.error(`Error applying rule ${rule.id}:`, error);
        rulesFailed++;

        results.push({
          ruleId: rule.id,
          ruleDescription: rule.descriptionString,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Complete activity tracking
    if (activity) {
      await completeActivity(
        activity.id,
        `Applied ${rulesSucceeded} of ${rules.length} rules. ${totalTransactionsUpdated} transactions updated.`,
        {
          rulesProcessed: rules.length,
          rulesSucceeded,
          rulesFailed,
          totalTransactionsUpdated,
          totalSpendingTypesAdded,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        rulesProcessed: rules.length,
        rulesSucceeded,
        rulesFailed,
        totalTransactionsUpdated,
        totalSpendingTypesAdded,
        results,
      },
      message: `Applied ${rulesSucceeded} of ${rules.length} rules. ${totalTransactionsUpdated} transactions updated.`,
    });
  } catch (error: any) {
    console.error('Error applying all categorization rules:', error);

    // Fail activity tracking
    if (activity) {
      await failActivity(
        activity.id,
        'Failed to apply all categorization rules',
        error instanceof Error ? error.stack : String(error)
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply all categorization rules',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
