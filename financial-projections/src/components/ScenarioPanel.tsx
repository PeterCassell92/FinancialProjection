'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import {
  fetchDecisionPaths,
  fetchScenarioSets,
  toggleDecisionPath,
  loadScenarioSet,
  openSaveModal,
} from '@/lib/redux/scenarioSlice';

interface ScenarioPanelProps {
  recurringPanelExpanded?: boolean;
}

export default function ScenarioPanel({ recurringPanelExpanded = false }: ScenarioPanelProps) {
  const dispatch = useAppDispatch();

  const {
    allDecisionPaths,
    scenarioSets,
    activeScenarioSetId,
    currentDecisionPathStates,
    loading,
  } = useAppSelector((state) => state.scenario);

  useEffect(() => {
    // Fetch decision paths and scenario sets on mount
    dispatch(fetchDecisionPaths());
    dispatch(fetchScenarioSets());
  }, [dispatch]);

  const handleToggleDecisionPath = (decisionPathId: string) => {
    dispatch(toggleDecisionPath(decisionPathId));
  };

  const handleLoadScenario = (scenarioSetId: string) => {
    dispatch(loadScenarioSet(scenarioSetId));
  };

  const handleSaveScenario = () => {
    dispatch(openSaveModal());
  };

  const activeScenario = scenarioSets.find(s => s.id === activeScenarioSetId);

  // Adjust right margin based on recurring panel state
  const rightMargin = recurringPanelExpanded ? 'mr-96' : 'mr-12';

  return (
    <div className={`w-80 bg-white border-l border-gray-200 flex flex-col h-full transition-all duration-300 ${rightMargin}`} data-testid="scenario-panel">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900" data-testid="scenario-panel-title">
          Scenario Planning
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Toggle decision paths to explore different scenarios
        </p>
      </div>

      {/* Scenario Set Selector */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Active Scenario
        </label>
        <select
          value={activeScenarioSetId || ''}
          onChange={(e) => handleLoadScenario(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          data-testid="scenario-selector"
        >
          {scenarioSets.map((scenario) => (
            <option key={scenario.id} value={scenario.id} data-testid={`scenario-option__${scenario.id}`}>
              {scenario.name} {scenario.isDefault && '(Default)'}
            </option>
          ))}
        </select>

        <button
          onClick={handleSaveScenario}
          className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          data-testid="save-scenario-button"
        >
          Save Current as New Scenario
        </button>
      </div>

      {/* Decision Paths List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3" data-testid="decision-paths-header">
          Decision Paths
        </h3>

        {loading ? (
          <div className="text-sm text-gray-500" data-testid="decision-paths-loading">
            Loading decision paths...
          </div>
        ) : allDecisionPaths.length === 0 ? (
          <div className="text-sm text-gray-500" data-testid="no-decision-paths">
            No decision paths yet. Create projection events with decision paths to see them here.
          </div>
        ) : (
          <div className="space-y-2">
            {allDecisionPaths.map((decisionPath) => {
              const isEnabled = currentDecisionPathStates[decisionPath.id] ?? true;

              return (
                <label
                  key={decisionPath.id}
                  className={`
                    flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors
                    ${isEnabled
                      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }
                  `}
                  data-testid={`decision-path-item__${decisionPath.id}`}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleToggleDecisionPath(decisionPath.id)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    data-testid={`decision-path-checkbox__${decisionPath.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900" data-testid={`decision-path-name__${decisionPath.id}`}>
                      {decisionPath.name}
                    </div>
                    {decisionPath.description && (
                      <div className="text-xs text-gray-600 mt-1" data-testid={`decision-path-description__${decisionPath.id}`}>
                        {decisionPath.description}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Scenario Info */}
      {activeScenario && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            <div className="font-medium text-gray-900 mb-1">
              {activeScenario.name}
            </div>
            {activeScenario.description && (
              <div className="text-gray-600">{activeScenario.description}</div>
            )}
            <div className="mt-2 text-gray-500">
              {Object.values(currentDecisionPathStates).filter(Boolean).length} of {allDecisionPaths.length} paths enabled
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
