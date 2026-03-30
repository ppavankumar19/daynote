'use client';

import { create } from 'zustand';
import type { UserPreferences } from '@/types';

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultLanguage: 'en',
  theme: 'system',
  editorMode: 'markdown',
  uiLocale: 'en',
  aiEnabled: false,
  storageAdapter: 'localstorage',
};

interface PreferencesState {
  preferences: UserPreferences;
  isLoaded: boolean;
  load: () => Promise<void>;
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>()((set, get) => ({
  preferences: { ...DEFAULT_PREFERENCES },
  isLoaded: false,

  load: async () => {
    try {
      const { getStorageAdapter } = await import('@/lib/storage/factory');
      const adapter = getStorageAdapter();
      const prefs = await adapter.getPreferences();
      set({ preferences: prefs, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  setPreference: async (key, value) => {
    const updated = { ...get().preferences, [key]: value };
    set({ preferences: updated });
    try {
      const { getStorageAdapter } = await import('@/lib/storage/factory');
      await getStorageAdapter().savePreferences(updated);
    } catch (e) {
      console.error('[DayNote] Failed to save preferences', e);
    }
  },

  resetPreferences: async () => {
    set({ preferences: { ...DEFAULT_PREFERENCES } });
    try {
      const { getStorageAdapter } = await import('@/lib/storage/factory');
      await getStorageAdapter().savePreferences({ ...DEFAULT_PREFERENCES });
    } catch (e) {
      console.error('[DayNote] Failed to reset preferences', e);
    }
  },
}));
