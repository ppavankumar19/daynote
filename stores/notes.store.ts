'use client';

import { create } from 'zustand';
import type { Note, TagIndex } from '@/types';
import { generateId, todayISO, computeWordCount, inferTitle } from '@/lib/utils';

interface NotesState {
  notesByDate: Record<string, Note[]>;
  allNotes: Note[];
  tagIndex: TagIndex;
  currentDate: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  loadDate: (date: string) => Promise<void>;
  loadAll: () => Promise<void>;
  createNote: (date: string, defaults?: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, patch: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  pinNote: (id: string, pinned: boolean) => Promise<void>;
  archiveNote: (id: string, archived: boolean) => Promise<void>;
}

export const useNotesStore = create<NotesState>()((set, get) => ({
  notesByDate: {},
  allNotes: [],
  tagIndex: {},
  currentDate: todayISO(),
  isLoading: false,
  isSaving: false,
  error: null,

  loadDate: async (date: string) => {
    set({ isLoading: true, error: null, currentDate: date });
    try {
      const { getStorageAdapter } = await import('@/lib/storage/factory');
      const adapter = getStorageAdapter();
      const notes = await adapter.getNotesByDate(date);
      set((state) => ({
        notesByDate: { ...state.notesByDate, [date]: notes },
        isLoading: false,
      }));
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadAll: async () => {
    set({ isLoading: true });
    try {
      const { getStorageAdapter } = await import('@/lib/storage/factory');
      const notes = await getStorageAdapter().getAllNotes();
      const notesByDate: Record<string, Note[]> = {};
      const tagIndex: TagIndex = {};

      for (const note of notes) {
        if (!notesByDate[note.date]) notesByDate[note.date] = [];
        notesByDate[note.date].push(note);
        for (const tag of note.tags) {
          if (!tagIndex[tag]) tagIndex[tag] = [];
          tagIndex[tag].push(note.id);
        }
      }

      set({ allNotes: notes, notesByDate, tagIndex, isLoading: false });

      // Update search index
      const { useSearchStore } = await import('@/stores/search.store');
      useSearchStore.getState().buildIndex(notes);
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  createNote: async (date, defaults = {}) => {
    const prefs = (await import('@/stores/preferences.store')).usePreferencesStore.getState().preferences;
    const now = new Date().toISOString();
    const note: Note = {
      id: generateId(),
      date,
      createdAt: now,
      updatedAt: now,
      language: defaults.language ?? prefs.defaultLanguage ?? 'en',
      content: defaults.content ?? '',
      tags: defaults.tags ?? [],
      title: defaults.title ?? '',
      pinned: false,
      archived: false,
      wordCount: 0,
      ...defaults,
    };

    set({ isSaving: true });
    try {
      const { getStorageAdapter } = await import('@/lib/storage/factory');
      await getStorageAdapter().saveNote(note);
      set((state) => ({
        notesByDate: {
          ...state.notesByDate,
          [date]: [...(state.notesByDate[date] ?? []), note],
        },
        allNotes: [note, ...state.allNotes],
        isSaving: false,
      }));
      return note;
    } catch (e) {
      set({ error: String(e), isSaving: false });
      throw e;
    }
  },

  updateNote: async (id, patch) => {
    const state = get();
    const existing = state.allNotes.find((n) => n.id === id);
    if (!existing) return;

    const content = patch.content ?? existing.content;
    const updated: Note = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
      wordCount: patch.content !== undefined ? computeWordCount(content) : existing.wordCount,
      title: patch.content !== undefined ? inferTitle(content) : (patch.title ?? existing.title),
    };

    set({ isSaving: true });
    try {
      const { getStorageAdapter } = await import('@/lib/storage/factory');
      await getStorageAdapter().saveNote(updated);

      // Update allNotes
      const allNotes = state.allNotes.map((n) => (n.id === id ? updated : n));
      // Update notesByDate
      const notesByDate = { ...state.notesByDate };
      if (notesByDate[updated.date]) {
        notesByDate[updated.date] = notesByDate[updated.date].map((n) =>
          n.id === id ? updated : n
        );
      }
      // Rebuild tagIndex
      const tagIndex: TagIndex = {};
      for (const note of allNotes) {
        for (const tag of note.tags) {
          if (!tagIndex[tag]) tagIndex[tag] = [];
          tagIndex[tag].push(note.id);
        }
      }

      set({ allNotes, notesByDate, tagIndex, isSaving: false });

      // Refresh search index
      const { useSearchStore } = await import('@/stores/search.store');
      useSearchStore.getState().buildIndex(allNotes);
    } catch (e) {
      set({ error: String(e), isSaving: false });
    }
  },

  deleteNote: async (id) => {
    try {
      const { getStorageAdapter } = await import('@/lib/storage/factory');
      await getStorageAdapter().deleteNote(id);
      const allNotes = get().allNotes.filter((n) => n.id !== id);
      const notesByDate = { ...get().notesByDate };
      for (const date of Object.keys(notesByDate)) {
        notesByDate[date] = notesByDate[date].filter((n) => n.id !== id);
      }
      set({ allNotes, notesByDate });

      const { useSearchStore } = await import('@/stores/search.store');
      useSearchStore.getState().buildIndex(allNotes);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  pinNote: (id, pinned) => get().updateNote(id, { pinned }),
  archiveNote: (id, archived) => get().updateNote(id, { archived }),
}));
