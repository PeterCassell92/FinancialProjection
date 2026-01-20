import prisma from '@/lib/prisma';
import { TransactionCategorizationRule, CategorizationRuleSpendingType } from '@prisma/client';

/**
 * Input type for creating a categorization rule
 */
export interface CreateCategorizationRuleInput {
  descriptionString: string;
  exactMatch: boolean;
  spendingTypeIds: string[];
}

/**
 * Input type for updating a categorization rule
 */
export interface UpdateCategorizationRuleInput {
  descriptionString?: string;
  exactMatch?: boolean;
  spendingTypeIds?: string[];
}

/**
 * Type for a categorization rule with its spending types
 */
export type CategorizationRuleWithSpendingTypes = TransactionCategorizationRule & {
  spendingTypes: (CategorizationRuleSpendingType & {
    spendingType: {
      id: string;
      name: string;
    };
  })[];
};

/**
 * Get all categorization rules with their spending types
 */
export async function getAllCategorizationRules(): Promise<CategorizationRuleWithSpendingTypes[]> {
  return await prisma.transactionCategorizationRule.findMany({
    include: {
      spendingTypes: {
        include: {
          spendingType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      descriptionString: 'asc',
    },
  });
}

/**
 * Get a categorization rule by ID with its spending types
 */
export async function getCategorizationRuleById(
  id: string
): Promise<CategorizationRuleWithSpendingTypes | null> {
  return await prisma.transactionCategorizationRule.findUnique({
    where: { id },
    include: {
      spendingTypes: {
        include: {
          spendingType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Create a new categorization rule with spending types
 */
export async function createCategorizationRule(
  input: CreateCategorizationRuleInput
): Promise<CategorizationRuleWithSpendingTypes> {
  return await prisma.transactionCategorizationRule.create({
    data: {
      descriptionString: input.descriptionString,
      exactMatch: input.exactMatch,
      spendingTypes: {
        create: input.spendingTypeIds.map((spendingTypeId) => ({
          spendingTypeId,
        })),
      },
    },
    include: {
      spendingTypes: {
        include: {
          spendingType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Update a categorization rule
 * If spendingTypeIds is provided, replaces all spending type associations
 */
export async function updateCategorizationRule(
  id: string,
  input: UpdateCategorizationRuleInput
): Promise<CategorizationRuleWithSpendingTypes> {
  // If spending type IDs are provided, we need to replace them in a transaction
  if (input.spendingTypeIds !== undefined) {
    return await prisma.$transaction(async (tx) => {
      // Delete existing spending type associations
      await tx.categorizationRuleSpendingType.deleteMany({
        where: { categorizationRuleId: id },
      });

      // Update the rule and create new associations
      return await tx.transactionCategorizationRule.update({
        where: { id },
        data: {
          descriptionString: input.descriptionString,
          exactMatch: input.exactMatch,
          spendingTypes: {
            create: input.spendingTypeIds!.map((spendingTypeId) => ({
              spendingTypeId,
            })),
          },
        },
        include: {
          spendingTypes: {
            include: {
              spendingType: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });
  } else {
    // Simple update without changing spending types
    return await prisma.transactionCategorizationRule.update({
      where: { id },
      data: {
        descriptionString: input.descriptionString,
        exactMatch: input.exactMatch,
      },
      include: {
        spendingTypes: {
          include: {
            spendingType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }
}

/**
 * Delete a categorization rule
 * Cascade deletes all spending type associations
 */
export async function deleteCategorizationRule(id: string): Promise<void> {
  await prisma.transactionCategorizationRule.delete({
    where: { id },
  });
}

/**
 * Find matching categorization rules for a transaction description
 * Returns all rules that match, ordered by exactMatch first (exact matches take priority)
 */
export async function findMatchingCategorizationRules(
  transactionDescription: string
): Promise<CategorizationRuleWithSpendingTypes[]> {
  // Get all rules with their spending types
  const allRules = await getAllCategorizationRules();

  // Filter rules that match the transaction description
  const matchingRules = allRules.filter((rule) => {
    if (rule.exactMatch) {
      // Exact match: case-insensitive comparison
      return rule.descriptionString.toLowerCase() === transactionDescription.toLowerCase();
    } else {
      // Partial match: case-insensitive contains
      return transactionDescription.toLowerCase().includes(rule.descriptionString.toLowerCase());
    }
  });

  // Sort to prioritize exact matches
  return matchingRules.sort((a, b) => {
    if (a.exactMatch && !b.exactMatch) return -1;
    if (!a.exactMatch && b.exactMatch) return 1;
    return 0;
  });
}

/**
 * Get all spending type IDs that should be applied to a transaction description
 * Combines all matching rules and returns unique spending type IDs
 */
export async function getSpendingTypeIdsForTransaction(
  transactionDescription: string
): Promise<string[]> {
  const matchingRules = await findMatchingCategorizationRules(transactionDescription);

  // Collect all spending type IDs from all matching rules
  const spendingTypeIds = new Set<string>();

  for (const rule of matchingRules) {
    for (const st of rule.spendingTypes) {
      spendingTypeIds.add(st.spendingTypeId);
    }
  }

  return Array.from(spendingTypeIds);
}

/**
 * Get spending type associations with their categorization rule IDs
 * Returns an array of {spendingTypeId, categorizationRuleId} for tracking which rule applied which type
 */
export async function getSpendingTypeAssociationsForTransaction(
  transactionDescription: string
): Promise<Array<{ spendingTypeId: string; categorizationRuleId: string }>> {
  const matchingRules = await findMatchingCategorizationRules(transactionDescription);

  const associations: Array<{ spendingTypeId: string; categorizationRuleId: string }> = [];

  for (const rule of matchingRules) {
    for (const st of rule.spendingTypes) {
      associations.push({
        spendingTypeId: st.spendingTypeId,
        categorizationRuleId: rule.id,
      });
    }
  }

  return associations;
}
