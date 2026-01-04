import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface DecisionPath {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface ScenarioSetDecisionPath {
  id: string;
  scenarioSetId: string;
  decisionPathId: string;
  enabled: boolean;
  decisionPath: DecisionPath;
}

export interface ScenarioSet {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  decisionPaths: ScenarioSetDecisionPath[];
}

export interface ScenarioState {
  // All available decision paths in the system
  allDecisionPaths: DecisionPath[];

  // All saved scenario sets
  scenarioSets: ScenarioSet[];

  // Currently active scenario set
  activeScenarioSetId: string | null;

  // Current decision path states (for the active scenario)
  // Maps decision path ID to enabled/disabled state
  currentDecisionPathStates: Record<string, boolean>;

  // UI state
  loading: boolean;
  error: string | null;
  isSaveModalOpen: boolean;
}

const initialState: ScenarioState = {
  allDecisionPaths: [],
  scenarioSets: [],
  activeScenarioSetId: null,
  currentDecisionPathStates: {},
  loading: false,
  error: null,
  isSaveModalOpen: false,
};

// Async thunks for API calls

/**
 * Fetch all decision paths
 */
export const fetchDecisionPaths = createAsyncThunk(
  'scenario/fetchDecisionPaths',
  async () => {
    const response = await fetch('/api/decision-paths');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch decision paths');
    }

    return data.data;
  }
);

/**
 * Fetch all scenario sets
 */
export const fetchScenarioSets = createAsyncThunk(
  'scenario/fetchScenarioSets',
  async () => {
    const response = await fetch('/api/scenario-sets');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch scenario sets');
    }

    return data.data;
  }
);

/**
 * Create a new decision path
 */
export const createDecisionPath = createAsyncThunk(
  'scenario/createDecisionPath',
  async (payload: { name: string; description?: string }) => {
    const response = await fetch('/api/decision-paths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create decision path');
    }

    return data.data;
  }
);

/**
 * Save current scenario as a new scenario set
 */
export const saveScenarioSet = createAsyncThunk(
  'scenario/saveScenarioSet',
  async (payload: {
    name: string;
    description?: string;
    decisionPathStates: Record<string, boolean>;
  }) => {
    const response = await fetch('/api/scenario-sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to save scenario set');
    }

    return data.data;
  }
);

/**
 * Update a scenario set's decision path states
 */
export const updateScenarioSetDecisionPaths = createAsyncThunk(
  'scenario/updateScenarioSetDecisionPaths',
  async (payload: {
    scenarioSetId: string;
    decisionPathStates: Record<string, boolean>;
  }) => {
    const response = await fetch(`/api/scenario-sets/${payload.scenarioSetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decisionPathStates: payload.decisionPathStates }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update scenario set');
    }

    return data.data;
  }
);

/**
 * Delete a scenario set
 */
export const deleteScenarioSet = createAsyncThunk(
  'scenario/deleteScenarioSet',
  async (scenarioSetId: string) => {
    const response = await fetch(`/api/scenario-sets/${scenarioSetId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete scenario set');
    }

    return scenarioSetId;
  }
);

const scenarioSlice = createSlice({
  name: 'scenario',
  initialState,
  reducers: {
    /**
     * Toggle a decision path's enabled state
     */
    toggleDecisionPath: (state, action: PayloadAction<string>) => {
      const decisionPathId = action.payload;
      state.currentDecisionPathStates[decisionPathId] =
        !state.currentDecisionPathStates[decisionPathId];
    },

    /**
     * Set the enabled state for a specific decision path
     */
    setDecisionPathEnabled: (
      state,
      action: PayloadAction<{ decisionPathId: string; enabled: boolean }>
    ) => {
      state.currentDecisionPathStates[action.payload.decisionPathId] =
        action.payload.enabled;
    },

    /**
     * Load a scenario set (switch to it)
     */
    loadScenarioSet: (state, action: PayloadAction<string>) => {
      const scenarioSetId = action.payload;
      const scenarioSet = state.scenarioSets.find(s => s.id === scenarioSetId);

      if (scenarioSet) {
        state.activeScenarioSetId = scenarioSetId;

        // Build the decision path states from the scenario set
        const decisionPathStates: Record<string, boolean> = {};

        // First, set all decision paths to enabled by default
        state.allDecisionPaths.forEach(dp => {
          decisionPathStates[dp.id] = true;
        });

        // Then override with the scenario set's states
        scenarioSet.decisionPaths.forEach(sdp => {
          decisionPathStates[sdp.decisionPathId] = sdp.enabled;
        });

        state.currentDecisionPathStates = decisionPathStates;
      }
    },

    /**
     * Open the save scenario modal
     */
    openSaveModal: (state) => {
      state.isSaveModalOpen = true;
    },

    /**
     * Close the save scenario modal
     */
    closeSaveModal: (state) => {
      state.isSaveModalOpen = false;
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch decision paths
      .addCase(fetchDecisionPaths.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDecisionPaths.fulfilled, (state, action) => {
        state.loading = false;
        state.allDecisionPaths = action.payload;

        // Initialize current decision path states (all enabled by default)
        if (Object.keys(state.currentDecisionPathStates).length === 0) {
          const states: Record<string, boolean> = {};
          action.payload.forEach((dp: DecisionPath) => {
            states[dp.id] = true;
          });
          state.currentDecisionPathStates = states;
        }
      })
      .addCase(fetchDecisionPaths.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch decision paths';
      })

      // Fetch scenario sets
      .addCase(fetchScenarioSets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScenarioSets.fulfilled, (state, action) => {
        state.loading = false;
        state.scenarioSets = action.payload;

        // Set the default scenario as active if no active scenario
        if (!state.activeScenarioSetId) {
          const defaultScenario = action.payload.find((s: ScenarioSet) => s.isDefault);
          if (defaultScenario) {
            state.activeScenarioSetId = defaultScenario.id;
          }
        }
      })
      .addCase(fetchScenarioSets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch scenario sets';
      })

      // Create decision path
      .addCase(createDecisionPath.fulfilled, (state, action) => {
        state.allDecisionPaths.push(action.payload);
        // Add to current states (enabled by default)
        state.currentDecisionPathStates[action.payload.id] = true;
      })

      // Save scenario set
      .addCase(saveScenarioSet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveScenarioSet.fulfilled, (state, action) => {
        state.loading = false;
        state.scenarioSets.push(action.payload);
        state.isSaveModalOpen = false;
      })
      .addCase(saveScenarioSet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save scenario set';
      })

      // Update scenario set decision paths
      .addCase(updateScenarioSetDecisionPaths.fulfilled, (state, action) => {
        const index = state.scenarioSets.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.scenarioSets[index] = action.payload;
        }
      })

      // Delete scenario set
      .addCase(deleteScenarioSet.fulfilled, (state, action) => {
        state.scenarioSets = state.scenarioSets.filter(s => s.id !== action.payload);

        // If we deleted the active scenario, switch to default
        if (state.activeScenarioSetId === action.payload) {
          const defaultScenario = state.scenarioSets.find(s => s.isDefault);
          if (defaultScenario) {
            state.activeScenarioSetId = defaultScenario.id;

            // Reload decision path states from default scenario
            const decisionPathStates: Record<string, boolean> = {};
            state.allDecisionPaths.forEach(dp => {
              decisionPathStates[dp.id] = true;
            });
            defaultScenario.decisionPaths.forEach(sdp => {
              decisionPathStates[sdp.decisionPathId] = sdp.enabled;
            });
            state.currentDecisionPathStates = decisionPathStates;
          }
        }
      });
  },
});

export const {
  toggleDecisionPath,
  setDecisionPathEnabled,
  loadScenarioSet,
  openSaveModal,
  closeSaveModal,
  clearError,
} = scenarioSlice.actions;

export default scenarioSlice.reducer;
