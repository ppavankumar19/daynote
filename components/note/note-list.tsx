'use client';

import { useNotesStore } from '@/stores/notes.store';
import { useSearchStore } from '@/stores/search.store';
import { NoteCard } from './note-card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, FileText } from 'lucide-react';

interface NoteListProps {
  date: string;
  onNewNote: () => void;
}

export function NoteList({ date, onNewNote }: NoteListProps) {
  const { notesByDate, isLoading } = useNotesStore();
  const activeTagFilter = useSearchStore((s) => s.activeTagFilter);

  const allNotes = notesByDate[date] ?? [];
  const notes = activeTagFilter
    ? allNotes.filter((n) => n.tags.includes(activeTagFilter))
    : allNotes;

  const pinnedNotes = notes.filter((n) => n.pinned);
  const unpinnedNotes = notes.filter((n) => !n.pinned);
  const sortedNotes = [...pinnedNotes, ...unpinnedNotes];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {activeTagFilter && notes.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No notes tagged &ldquo;{activeTagFilter}&rdquo; for this day.
            </p>
          </div>
        )}

        {!activeTagFilter && notes.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">No notes yet</p>
            <p className="mb-4 text-xs text-muted-foreground">
              Start writing your first note for this day
            </p>
            <Button size="sm" onClick={onNewNote}>
              <Plus className="me-1.5 h-3.5 w-3.5" />
              New note
            </Button>
          </div>
        )}

        {sortedNotes.map((note, i) => (
          <NoteCard key={note.id} note={note} autoFocus={i === sortedNotes.length - 1} />
        ))}
      </div>
    </ScrollArea>
  );
}
