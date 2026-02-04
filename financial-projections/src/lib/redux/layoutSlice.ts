import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

interface LayoutState {
  hasRightSidebar: boolean;
  isRightSidebarExpanded: boolean;
}

const initialState: LayoutState = {
  hasRightSidebar: false,
  isRightSidebarExpanded: true,
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    setRightSidebar: (state, action: PayloadAction<{ hasRightSidebar: boolean; isExpanded?: boolean }>) => {
      state.hasRightSidebar = action.payload.hasRightSidebar;
      if (action.payload.isExpanded !== undefined) {
        state.isRightSidebarExpanded = action.payload.isExpanded;
      }
    },
    toggleRightSidebar: (state) => {
      state.isRightSidebarExpanded = !state.isRightSidebarExpanded;
    },
  },
});

export const { setRightSidebar, toggleRightSidebar } = layoutSlice.actions;

// Selectors
export const selectHasRightSidebar = (state: RootState) => state.layout.hasRightSidebar;
export const selectIsRightSidebarExpanded = (state: RootState) => state.layout.isRightSidebarExpanded;

export default layoutSlice.reducer;
