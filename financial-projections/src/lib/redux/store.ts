import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './settingsSlice';
import scenarioReducer from './scenarioSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      settings: settingsReducer,
      scenario: scenarioReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
