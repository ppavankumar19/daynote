'use client';

import { useEffect } from 'react';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useNotesStore } from '@/stores/notes.store';
import { useSearchStore } from '@/stores/search.store';

export function AppInitializer() {
  const loadPreferences = usePreferencesStore((s) => s.load);
  const loadAll = useNotesStore((s) => s.loadAll);

  useEffect(() => {
    loadPreferences().then(() => loadAll());
  }, [loadPreferences, loadAll]);

  return null;
}
