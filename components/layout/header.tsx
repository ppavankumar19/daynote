'use client';

import { useRouter } from 'next/navigation';
import { todayISO } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSearchStore } from '@/stores/search.store';
import { SettingsDrawer } from '@/components/settings/preferences-drawer';
import { Search, Plus, Home } from 'lucide-react';
import { useEffect } from 'react';

export function Header({ currentDate }: { currentDate: string }) {
  const router = useRouter();
  const openPalette = useSearchStore((s) => s.openPalette);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(
        (document.activeElement as HTMLElement)?.tagName
      );
      // Ctrl/Cmd+K: open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }
      // N: new note (when not in editor)
      if (e.key === 'n' && !isInputFocused && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // Trigger via a custom event that DayViewClient listens for
        document.dispatchEvent(new CustomEvent('daynote:new-note'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openPalette]);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold tracking-tight">DayNote</h1>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/notes/${todayISO()}`)}
          aria-label="Go to today"
          title="Today"
        >
          <Home className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={openPalette}
          aria-label="Search notes (Ctrl+K)"
          title="Search (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => document.dispatchEvent(new CustomEvent('daynote:new-note'))}
          aria-label="New note (N)"
          title="New note (N)"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <SettingsDrawer />
      </div>
    </header>
  );
}
