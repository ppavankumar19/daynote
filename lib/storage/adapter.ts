import type { Note, UserPreferences, ExportBundle } from '@/types';

export interface StorageAdapter {
  getNotesByDate(date: string): Promise<Note[]>;
  getAllNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | null>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  exportAll(): Promise<ExportBundle>;
  importBundle(bundle: ExportBundle, mode: 'merge' | 'overwrite'): Promise<void>;
  getPreferences(): Promise<UserPreferences>;
  savePreferences(prefs: UserPreferences): Promise<void>;
  getStorageInfo(): Promise<{ usedBytes: number; noteCount: number }>;
  clearAll(): Promise<void>;
}
