'use client';

import { useEffect, useCallback } from 'react';
import { useNotesStore } from '@/stores/notes.store';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { NoteList } from './note-list';
import { CommandPalette } from '@/components/search/command-palette';
import { BotPanel } from '@/components/ai/bot-panel';
import { usePreferencesStore } from '@/stores/preferences.store';
import { formatDisplayDate } from '@/lib/utils';

interface DayViewClientProps {
  date: string;
}

export function DayViewClient({ date }: DayViewClientProps) {
  const { loadDate, createNote } = useNotesStore();
  const aiEnabled = usePreferencesStore((s) => s.preferences.aiEnabled);

  useEffect(() => {
    loadDate(date);
  }, [date, loadDate]);

  const handleNewNote = useCallback(async () => {
    await createNote(date);
  }, [date, createNote]);

  // Listen for global new-note shortcut
  useEffect(() => {
    const handler = () => handleNewNote();
    document.addEventListener('daynote:new-note', handler);
    return () => document.removeEventListener('daynote:new-note', handler);
  }, [handleNewNote]);

  const displayDate = formatDisplayDate(date);

  return (
    <div className="flex h-full w-full flex-col">
      <Header currentDate={date} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on small screens */}
        <div className="hidden md:block">
          <Sidebar currentDate={date} />
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Date header */}
            <div className="border-b px-6 py-3">
              <h2 className="text-base font-semibold">{displayDate}</h2>
            </div>

            {/* Note list */}
            <div className="flex-1 overflow-hidden">
              <NoteList date={date} onNewNote={handleNewNote} />
            </div>
          </div>

          {/* AI panel — right side */}
          {aiEnabled && (
            <div className="hidden lg:block">
              <BotPanel />
            </div>
          )}
        </div>
      </div>

      {/* Command palette */}
      <CommandPalette />
    </div>
  );
}
