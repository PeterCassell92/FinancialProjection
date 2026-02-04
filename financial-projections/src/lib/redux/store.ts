import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './settingsSlice';
import scenarioReducer from './scenarioSlice';
import bankRecordsReducer from './bankRecordsSlice';
import bankAccountsReducer from './bankAccountsSlice';
import activityLogReducer from './activityLogSlice';
import projectionEventsReducer from './projectionEventsSlice';
import layoutReducer from './layoutSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      settings: settingsReducer,
      scenario: scenarioReducer,
      bankRecords: bankRecordsReducer,
      bankAccounts: bankAccountsReducer,
      activityLog: activityLogReducer,
      projectionEvents: projectionEventsReducer,
      layout: layoutReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
