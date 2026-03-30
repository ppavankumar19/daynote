import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter } from '@/lib/storage/localstorage';
import type { Note } from '@/types';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    date: '2025-03-25',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    language: 'en',
    content: 'Hello world',
    tags: ['test'],
    title: 'Hello',
    pinned: false,
    archived: false,
    wordCount: 2,
    ...overrides,
  };
}

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageAdapter();
  });

  it('saves and retrieves a note', async () => {
    const note = makeNote();
    await adapter.saveNote(note);
    const retrieved = await adapter.getNote(note.id);
    expect(retrieved).toEqual(note);
  });

  it('getNotesByDate returns notes for the correct date', async () => {
    const note1 = makeNote({ id: 'n1', date: '2025-03-25' });
    const note2 = makeNote({ id: 'n2', date: '2025-03-26' });
    await adapter.saveNote(note1);
    await adapter.saveNote(note2);

    const results = await adapter.getNotesByDate('2025-03-25');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('n1');
  });

  it('deletes a note', async () => {
    const note = makeNote();
    await adapter.saveNote(note);
    await adapter.deleteNote(note.id);
    const retrieved = await adapter.getNote(note.id);
    expect(retrieved).toBeNull();
  });

  it('returns all notes', async () => {
    await adapter.saveNote(makeNote({ id: 'n1' }));
    await adapter.saveNote(makeNote({ id: 'n2' }));
    const all = await adapter.getAllNotes();
    expect(all).toHaveLength(2);
  });

  it('exports all notes and preferences', async () => {
    await adapter.saveNote(makeNote());
    const bundle = await adapter.exportAll();
    expect(bundle.version).toBe(1);
    expect(bundle.notes).toHaveLength(1);
  });

  it('imports with merge — newer updatedAt wins', async () => {
    const old = makeNote({ updatedAt: '2025-01-01T00:00:00Z', content: 'old' });
    await adapter.saveNote(old);

    const newer = makeNote({ updatedAt: '2025-06-01T00:00:00Z', content: 'new' });
    await adapter.importBundle(
      { version: 1, exportedAt: new Date().toISOString(), notes: [newer] },
      'merge'
    );

    const result = await adapter.getNote('note-1');
    expect(result?.content).toBe('new');
  });

  it('imports with overwrite — replaces all', async () => {
    await adapter.saveNote(makeNote({ id: 'n1' }));
    const importNote = makeNote({ id: 'n2', content: 'imported' });

    await adapter.importBundle(
      { version: 1, exportedAt: new Date().toISOString(), notes: [importNote] },
      'overwrite'
    );

    const all = await adapter.getAllNotes();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('n2');
  });

  it('clears all data', async () => {
    await adapter.saveNote(makeNote());
    await adapter.clearAll();
    const all = await adapter.getAllNotes();
    expect(all).toHaveLength(0);
  });

  it('saves and retrieves preferences', async () => {
    const prefs = await adapter.getPreferences();
    prefs.defaultLanguage = 'te';
    await adapter.savePreferences(prefs);
    const retrieved = await adapter.getPreferences();
    expect(retrieved.defaultLanguage).toBe('te');
  });
});
