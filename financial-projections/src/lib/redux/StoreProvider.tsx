'use client';

import { useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from './store';
import { fetchSettings } from './settingsSlice';

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore>();

  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  useEffect(() => {
    // Fetch settings on mount
    if (storeRef.current) {
      storeRef.current.dispatch(fetchSettings());
    }
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
