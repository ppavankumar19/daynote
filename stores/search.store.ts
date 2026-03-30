'use client';

import { create } from 'zustand';
import Fuse from 'fuse.js';
import type { Note, SearchResult } from '@/types';

interface SearchState {
  query: string;
  results: SearchResult[];
  isOpen: boolean;
  fuse: Fuse<Note> | null;
  activeTagFilter: string | null;

  buildIndex: (notes: Note[]) => void;
  search: (query: string) => void;
  openPalette: () => void;
  closePalette: () => void;
  setTagFilter: (tag: string | null) => void;
}

export const useSearchStore = create<SearchState>()((set, get) => ({
  query: '',
  results: [],
  isOpen: false,
  fuse: null,
  activeTagFilter: null,

  buildIndex: (notes: Note[]) => {
    const fuse = new Fuse(notes, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'content', weight: 0.4 },
        { name: 'tags', weight: 0.2 },
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
    });
    set({ fuse });
  },

  search: (query: string) => {
    const { fuse } = get();
    if (!query.trim()) {
      set({ query, results: [] });
      return;
    }
    const raw = fuse ? fuse.search(query, { limit: 20 }) : [];
    set({
      query,
      results: raw as SearchResult[],
    });
  },

  openPalette: () => set({ isOpen: true }),
  closePalette: () => set({ isOpen: false, query: '', results: [] }),
  setTagFilter: (tag) => set({ activeTagFilter: tag }),
}));
