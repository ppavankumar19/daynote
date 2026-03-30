import type { StorageAdapter } from './adapter';
import type { Note, UserPreferences, ExportBundle } from '@/types';

const DB_NAME = 'daynote-db';
const DB_VERSION = 1;

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultLanguage: 'en',
  theme: 'system',
  editorMode: 'markdown',
  uiLocale: 'en',
  aiEnabled: false,
  storageAdapter: 'indexeddb',
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('notes')) {
        const store = db.createObjectStore('notes', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('prefs')) {
        db.createObjectStore('prefs', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txGet<T>(db: IDBDatabase, store: string, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

function txPut(db: IDBDatabase, store: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function txDelete(db: IDBDatabase, store: string, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function txGetAllByIndex(
  db: IDBDatabase,
  store: string,
  index: string,
  value: IDBValidKey
): Promise<Note[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).index(index).getAll(value);
    req.onsuccess = () => resolve(req.result as Note[]);
    req.onerror = () => reject(req.error);
  });
}

function txGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export class IndexedDBAdapter implements StorageAdapter {
  async getNotesByDate(date: string): Promise<Note[]> {
    const db = await openDB();
    return txGetAllByIndex(db, 'notes', 'date', date);
  }

  async getAllNotes(): Promise<Note[]> {
    const db = await openDB();
    return txGetAll<Note>(db, 'notes');
  }

  async getNote(id: string): Promise<Note | null> {
    const db = await openDB();
    const note = await txGet<Note>(db, 'notes', id);
    return note ?? null;
  }

  async saveNote(note: Note): Promise<void> {
    const db = await openDB();
    await txPut(db, 'notes', note);
  }

  async deleteNote(id: string): Promise<void> {
    const db = await openDB();
    await txDelete(db, 'notes', id);
  }

  async exportAll(): Promise<ExportBundle> {
    const notes = await this.getAllNotes();
    const preferences = await this.getPreferences();
    return { version: 1, exportedAt: new Date().toISOString(), notes, preferences };
  }

  async importBundle(bundle: ExportBundle, mode: 'merge' | 'overwrite'): Promise<void> {
    const db = await openDB();
    if (mode === 'overwrite') {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('notes', 'readwrite');
        tx.objectStore('notes').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    for (const note of bundle.notes) {
      if (mode === 'overwrite') {
        await txPut(db, 'notes', note);
      } else {
        const existing = await this.getNote(note.id);
        if (!existing || note.updatedAt > existing.updatedAt) {
          await txPut(db, 'notes', note);
        }
      }
    }
    if (bundle.preferences) {
      await this.savePreferences(bundle.preferences);
    }
  }

  async getPreferences(): Promise<UserPreferences> {
    const db = await openDB();
    const row = await txGet<{ key: string; value: UserPreferences }>(db, 'prefs', 'preferences');
    return row ? { ...DEFAULT_PREFERENCES, ...row.value } : { ...DEFAULT_PREFERENCES };
  }

  async savePreferences(prefs: UserPreferences): Promise<void> {
    const db = await openDB();
    await txPut(db, 'prefs', { key: 'preferences', value: prefs });
  }

  async getStorageInfo(): Promise<{ usedBytes: number; noteCount: number }> {
    const notes = await this.getAllNotes();
    const usedBytes = new Blob([JSON.stringify(notes)]).size;
    return { usedBytes, noteCount: notes.length };
  }

  async clearAll(): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['notes', 'prefs'], 'readwrite');
      tx.objectStore('notes').clear();
      tx.objectStore('prefs').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
