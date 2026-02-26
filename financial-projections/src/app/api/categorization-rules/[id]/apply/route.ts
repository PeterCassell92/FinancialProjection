import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getCategorizationRuleById,
} from '@/lib/dal/categorization-rules';
import prisma from '@/lib/prisma';
import { startActivity, completeActivity, failActivity } from '@/lib/services/activity-log-service';

const pathParams = z.object({ id: z.string() });

const ApplyCategorizationRuleRequestSchema = z.object({
  bankAccountId: z.string(),
});

/**
 * POST /api/categorization-rules/[id]/apply
 * Apply a categorization rule to existing transactions for a specific bank account
 */
export const { POST } = defineRoute({
  operationId: 'applyCategorizationRule',
  method: 'POST',
  summary: 'Apply a categorization rule',
  description: 'Apply a categorization rule to existing transactions for a specific bank account',
  tags: ['Categorization Rules'],
  pathParams,
  requestBody: ApplyCategorizationRuleRequestSchema,
  action: async ({ pathParams: { id }, body }) => {
    let activity: Awaited<ReturnType<typeof startActivity>> | null = null;

    try {
      // Get the categorization rule
      const rule = await getCategorizationRuleById(id);

      if (!rule) {
        return Response.json(
          {
            success: false,
            error: 'Categorization rule not found',
          },
          { status: 404 }
        );
      }

      // Start activity tracking
      activity = await startActivity('CATEGORIZATION_RULE_APPLIED', {
        entityType: 'CategorizationRule',
        entityId: rule.id,
        metadata: {
          ruleDescription: rule.descriptionString,
          exactMatch: rule.exactMatch,
          bankAccountId: body.bankAccountId,
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

      // Complete activity tracking
      if (activity) {
        await completeActivity(
          activity.id,
          `Applied rule to ${transactionsUpdated} transaction(s)`,
          {
            transactionsMatched: matchingTransactions.length,
            transactionsUpdated,
            spendingTypesAdded: spendingTypeAssociations.length,
          }
        );
      }

      return Response.json({
        success: true,
        data: {
          transactionsMatched: matchingTransactions.length,
          transactionsUpdated,
          spendingTypesAdded: spendingTypeAssociations.length,
        },
        message: `Applied rule to ${transactionsUpdated} transaction(s)`,
      });
    } catch (error: unknown) {
      console.error('Error applying categorization rule:', error);

      // Fail activity tracking
      if (activity) {
        await failActivity(
          activity.id,
          'Failed to apply categorization rule',
          error instanceof Error ? error.stack : String(error)
        );
      }

      if (error instanceof Object && 'code' in error && error.code === 'P2025') {
        return Response.json(
          {
            success: false,
            error: 'Categorization rule not found',
          },
          { status: 404 }
        );
      }

      return Response.json(
        {
          success: false,
          error: 'Failed to apply categorization rule',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: { description: 'Categorization rule applied successfully' },
    400: { description: 'Invalid request body' },
    404: { description: 'Categorization rule not found' },
    500: { description: 'Server error' },
  },
});
