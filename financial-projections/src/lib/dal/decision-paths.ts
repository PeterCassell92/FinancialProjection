import { prisma } from '@/lib/prisma';

/**
 * Get all decision paths
 */
export async function getAllDecisionPaths() {
  return await prisma.decisionPath.findMany({
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Get a decision path by ID
 */
export async function getDecisionPathById(id: string) {
  return await prisma.decisionPath.findUnique({
    where: { id },
  });
}

/**
 * Get a decision path by name
 */
export async function getDecisionPathByName(name: string) {
  return await prisma.decisionPath.findUnique({
    where: { name },
  });
}

/**
 * Create a new decision path
 * If a decision path with the same name exists, return the existing one
 */
export async function createDecisionPath(
  name: string,
  description?: string
) {
  // Check if it already exists
  const existing = await getDecisionPathByName(name);
  if (existing) {
    return existing;
  }

  return await prisma.decisionPath.create({
    data: {
      name,
      description,
    },
  });
}

/**
 * Update a decision path
 */
export async function updateDecisionPath(
  id: string,
  updates: {
    name?: string;
    description?: string;
  }
) {
  return await prisma.decisionPath.update({
    where: { id },
    data: updates,
  });
}

/**
 * Delete a decision path
 * Note: This will set decisionPathId to null on all related events due to onDelete: SetNull
 */
export async function deleteDecisionPath(id: string) {
  return await prisma.decisionPath.delete({
    where: { id },
  });
}

/**
 * Get all decision paths with their usage count
 */
export async function getDecisionPathsWithUsage() {
  const decisionPaths = await prisma.decisionPath.findMany({
    include: {
      _count: {
        select: {
          projectionEvents: true,
          recurringRules: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return decisionPaths.map((dp) => ({
    id: dp.id,
    name: dp.name,
    description: dp.description,
    createdAt: dp.createdAt,
    eventCount: dp._count.projectionEvents,
    recurringRuleCount: dp._count.recurringRules,
    totalUsage: dp._count.projectionEvents + dp._count.recurringRules,
  }));
}

/**
 * Get or create a decision path by name
 * Useful when creating events with decision paths
 */
export async function getOrCreateDecisionPath(
  name: string,
  description?: string
) {
  const existing = await getDecisionPathByName(name);
  if (existing) {
    return existing;
  }

  return await createDecisionPath(name, description);
}
