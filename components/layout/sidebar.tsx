'use client';

import { useRouter } from 'next/navigation';
import { useSearchStore } from '@/stores/search.store';
import { useNotesStore } from '@/stores/notes.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { previousDay, nextDay, isFuture } from '@/lib/utils/date';
import { formatDisplayDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar, Tag, X } from 'lucide-react';

interface SidebarProps {
  currentDate: string;
}

export function Sidebar({ currentDate }: SidebarProps) {
  const router = useRouter();
  const tagIndex = useNotesStore((s) => s.tagIndex);
  const { activeTagFilter, setTagFilter } = useSearchStore();

  const tags = Object.keys(tagIndex).sort();

  return (
    <aside
      className="flex h-full w-64 flex-col border-e bg-card"
      aria-label="Sidebar"
    >
      {/* Date navigation */}
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/notes/${previousDay(currentDate)}`)}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <button
            className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => router.push(`/notes/${currentDate}`)}
            aria-label="Current date"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs text-muted-foreground">
              {currentDate}
            </span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/notes/${nextDay(currentDate)}`)}
            disabled={isFuture(nextDay(currentDate))}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Date picker */}
        <input
          type="date"
          value={currentDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => {
            if (e.target.value) router.push(`/notes/${e.target.value}`);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Navigate to date"
        />
      </div>

      <Separator />

      {/* Tag cloud */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Tag className="h-3 w-3" />
            Tags
          </h2>
          {activeTagFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1 text-xs"
              onClick={() => setTagFilter(null)}
              aria-label="Clear tag filter"
            >
              <X className="me-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        <ScrollArea className="h-48">
          <div className="flex flex-wrap gap-1.5">
            {tags.length === 0 && (
              <p className="text-xs text-muted-foreground">No tags yet</p>
            )}
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(activeTagFilter === tag ? null : tag)}
                aria-pressed={activeTagFilter === tag}
              >
                <Badge
                  variant={activeTagFilter === tag ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                >
                  {tag}
                  <span className="ms-1 opacity-60">({tagIndex[tag]?.length ?? 0})</span>
                </Badge>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
