'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchStore } from '@/stores/search.store';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, Calendar, FileText } from 'lucide-react';
import { formatDisplayDate } from '@/lib/utils';

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, query, results, search, openPalette, closePalette } = useSearchStore();

  const handleSelect = (date: string, noteId: string) => {
    closePalette();
    router.push(`/notes/${date}#${noteId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closePalette()}>
      <DialogContent
        className="max-w-2xl gap-0 overflow-hidden p-0"
        aria-label="Search notes"
      >
        {/* Search input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="me-3 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search notes…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search query"
            role="searchbox"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          className="max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Search results"
          aria-live="polite"
        >
          {query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
              <FileText className="mb-2 h-8 w-8 opacity-50" />
              No results found
            </div>
          )}

          {!query && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Type to search across all notes…
            </div>
          )}

          {results.map(({ item, matches }) => {
            const contentMatch = matches?.find((m) => m.key === 'content');
            let excerpt = item.content.slice(0, 150);
            if (contentMatch?.value) excerpt = contentMatch.value.slice(0, 150);

            return (
              <button
                key={item.id}
                className="flex w-full flex-col gap-1 border-b px-4 py-3 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                onClick={() => handleSelect(item.date, item.id)}
                role="option"
                aria-selected={false}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDisplayDate(item.date)}
                  </span>
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-1.5 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {item.title && (
                  <p className="font-medium">{item.title}</p>
                )}
                <p className="text-xs text-muted-foreground line-clamp-2">{excerpt}</p>
              </button>
            );
          })}
        </div>

        {results.length > 0 && (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
