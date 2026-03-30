import type { StorageAdapter } from './adapter';
import type { Note, UserPreferences, ExportBundle, TagIndex } from '@/types';
import { todayISO } from '@/lib/utils';

const KEYS = {
  NOTES: 'daynote:notes',
  TAG_INDEX: 'daynote:tag-index',
  PREFERENCES: 'daynote:preferences',
} as const;

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultLanguage: 'en',
  theme: 'system',
  editorMode: 'markdown',
  uiLocale: 'en',
  aiEnabled: false,
  storageAdapter: 'localstorage',
};

export class LocalStorageAdapter implements StorageAdapter {
  private readNotes(): Record<string, Note> {
    try {
      const raw = localStorage.getItem(KEYS.NOTES);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private writeNotes(notes: Record<string, Note>): void {
    const serialized = JSON.stringify(notes);
    if (serialized.length > 4 * 1024 * 1024) {
      console.warn('[DayNote] localStorage usage > 4MB. Consider switching to IndexedDB adapter.');
    }
    localStorage.setItem(KEYS.NOTES, serialized);
  }

  private rebuildTagIndex(notes: Record<string, Note>): void {
    const index: TagIndex = {};
    for (const note of Object.values(notes)) {
      for (const tag of note.tags) {
        if (!index[tag]) index[tag] = [];
        if (!index[tag].includes(note.id)) index[tag].push(note.id);
      }
    }
    localStorage.setItem(KEYS.TAG_INDEX, JSON.stringify(index));
  }

  async getNotesByDate(date: string): Promise<Note[]> {
    const notes = this.readNotes();
    return Object.values(notes)
      .filter((n) => n.date === date && !n.archived)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getAllNotes(): Promise<Note[]> {
    const notes = this.readNotes();
    return Object.values(notes).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getNote(id: string): Promise<Note | null> {
    const notes = this.readNotes();
    return notes[id] ?? null;
  }

  async saveNote(note: Note): Promise<void> {
    const notes = this.readNotes();
    notes[note.id] = note;
    this.writeNotes(notes);
    this.rebuildTagIndex(notes);
  }

  async deleteNote(id: string): Promise<void> {
    const notes = this.readNotes();
    delete notes[id];
    this.writeNotes(notes);
    this.rebuildTagIndex(notes);
  }

  async exportAll(): Promise<ExportBundle> {
    const notes = await this.getAllNotes();
    const preferences = await this.getPreferences();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      notes,
      preferences,
    };
  }

  async importBundle(bundle: ExportBundle, mode: 'merge' | 'overwrite'): Promise<void> {
    if (mode === 'overwrite') {
      const notesMap: Record<string, Note> = {};
      for (const note of bundle.notes) {
        notesMap[note.id] = note;
      }
      this.writeNotes(notesMap);
      this.rebuildTagIndex(notesMap);
    } else {
      const existing = this.readNotes();
      for (const note of bundle.notes) {
        const current = existing[note.id];
        if (!current || note.updatedAt > current.updatedAt) {
          existing[note.id] = note;
        }
      }
      this.writeNotes(existing);
      this.rebuildTagIndex(existing);
    }
    if (bundle.preferences) {
      await this.savePreferences(bundle.preferences);
    }
  }

  async getPreferences(): Promise<UserPreferences> {
    try {
      const raw = localStorage.getItem(KEYS.PREFERENCES);
      if (!raw) return { ...DEFAULT_PREFERENCES };
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  async savePreferences(prefs: UserPreferences): Promise<void> {
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
  }

  async getStorageInfo(): Promise<{ usedBytes: number; noteCount: number }> {
    const raw = localStorage.getItem(KEYS.NOTES) ?? '{}';
    const usedBytes = new Blob([raw]).size;
    const notes = this.readNotes();
    return { usedBytes, noteCount: Object.keys(notes).length };
  }

  async clearAll(): Promise<void> {
    localStorage.removeItem(KEYS.NOTES);
    localStorage.removeItem(KEYS.TAG_INDEX);
    localStorage.removeItem(KEYS.PREFERENCES);
  }
}
