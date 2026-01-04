import { prisma } from '@/lib/prisma';

/**
 * Get all scenario sets
 */
export async function getAllScenarioSets() {
  return await prisma.scenarioSet.findMany({
    include: {
      decisionPaths: {
        include: {
          decisionPath: true,
        },
      },
    },
    orderBy: [
      { isDefault: 'desc' }, // Default scenario first
      { name: 'asc' },
    ],
  });
}

/**
 * Get a scenario set by ID with all decision path states
 */
export async function getScenarioSetById(id: string) {
  return await prisma.scenarioSet.findUnique({
    where: { id },
    include: {
      decisionPaths: {
        include: {
          decisionPath: true,
        },
      },
    },
  });
}

/**
 * Get the default scenario set (all decision paths enabled)
 */
export async function getDefaultScenarioSet() {
  return await prisma.scenarioSet.findFirst({
    where: { isDefault: true },
    include: {
      decisionPaths: {
        include: {
          decisionPath: true,
        },
      },
    },
  });
}

/**
 * Create a new scenario set
 * @param name - Name of the scenario
 * @param decisionPathStates - Map of decisionPathId -> enabled state
 * @param description - Optional description
 * @param isDefault - Whether this is the default scenario
 */
export async function createScenarioSet(
  name: string,
  decisionPathStates: Record<string, boolean>,
  description?: string,
  isDefault = false
) {
  return await prisma.scenarioSet.create({
    data: {
      name,
      description,
      isDefault,
      decisionPaths: {
        create: Object.entries(decisionPathStates).map(
          ([decisionPathId, enabled]) => ({
            decisionPathId,
            enabled,
          })
        ),
      },
    },
    include: {
      decisionPaths: {
        include: {
          decisionPath: true,
        },
      },
    },
  });
}

/**
 * Update a scenario set's name and description
 */
export async function updateScenarioSet(
  id: string,
  updates: {
    name?: string;
    description?: string;
  }
) {
  return await prisma.scenarioSet.update({
    where: { id },
    data: updates,
    include: {
      decisionPaths: {
        include: {
          decisionPath: true,
        },
      },
    },
  });
}

/**
 * Update the decision path states for a scenario set
 * This replaces all existing decision path states with the new ones
 */
export async function updateScenarioSetDecisionPaths(
  scenarioSetId: string,
  decisionPathStates: Record<string, boolean>
) {
  // Delete all existing decision path states
  await prisma.scenarioSetDecisionPath.deleteMany({
    where: { scenarioSetId },
  });

  // Create new decision path states
  await prisma.scenarioSetDecisionPath.createMany({
    data: Object.entries(decisionPathStates).map(
      ([decisionPathId, enabled]) => ({
        scenarioSetId,
        decisionPathId,
        enabled,
      })
    ),
  });

  return await getScenarioSetById(scenarioSetId);
}

/**
 * Delete a scenario set
 */
export async function deleteScenarioSet(id: string) {
  return await prisma.scenarioSet.delete({
    where: { id },
  });
}

/**
 * Get or create the default scenario set
 * The default scenario has all decision paths enabled
 */
export async function getOrCreateDefaultScenarioSet() {
  let defaultScenario = await getDefaultScenarioSet();

  if (!defaultScenario) {
    // Get all decision paths
    const allDecisionPaths = await prisma.decisionPath.findMany();

    // Create default scenario with all paths enabled
    const decisionPathStates: Record<string, boolean> = {};
    allDecisionPaths.forEach((dp) => {
      decisionPathStates[dp.id] = true;
    });

    defaultScenario = await createScenarioSet(
      'Default (All Enabled)',
      decisionPathStates,
      'Default scenario with all decision paths enabled',
      true
    );
  }

  return defaultScenario;
}

/**
 * Get the enabled decision paths for a scenario set
 * Returns a map of decision path IDs to their enabled state
 */
export async function getScenarioSetEnabledPaths(scenarioSetId: string) {
  const scenarioSet = await getScenarioSetById(scenarioSetId);

  if (!scenarioSet) {
    return {};
  }

  const enabledPaths: Record<string, boolean> = {};
  scenarioSet.decisionPaths.forEach((sdp) => {
    enabledPaths[sdp.decisionPathId] = sdp.enabled;
  });

  return enabledPaths;
}

/**
 * Get the current active scenario set state merged with all available decision paths
 * This handles the case where new decision paths have been added since the scenario was saved
 * New decision paths default to enabled: true
 */
export async function getActiveScenarioState(scenarioSetId: string) {
  // Get all available decision paths
  const allDecisionPaths = await prisma.decisionPath.findMany();

  // Get the scenario set's decision path states
  const scenarioStates = await getScenarioSetEnabledPaths(scenarioSetId);

  // Merge: use scenario state if available, otherwise default to true
  const activeState: Record<string, boolean> = {};
  allDecisionPaths.forEach((dp) => {
    activeState[dp.id] = scenarioStates[dp.id] ?? true; // Default to enabled if not in scenario
  });

  return activeState;
}

/**
 * Clone a scenario set with a new name
 */
export async function cloneScenarioSet(
  sourceScenarioSetId: string,
  newName: string,
  newDescription?: string
) {
  const sourceScenario = await getScenarioSetById(sourceScenarioSetId);

  if (!sourceScenario) {
    throw new Error('Source scenario set not found');
  }

  const decisionPathStates: Record<string, boolean> = {};
  sourceScenario.decisionPaths.forEach((sdp) => {
    decisionPathStates[sdp.decisionPathId] = sdp.enabled;
  });

  return await createScenarioSet(
    newName,
    decisionPathStates,
    newDescription || sourceScenario.description || undefined,
    false
  );
}
