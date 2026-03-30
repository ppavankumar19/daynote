'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useNotesStore } from '@/stores/notes.store';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tagIndex = useNotesStore((s) => s.tagIndex);

  const allTags = Object.keys(tagIndex);
  const suggestions = allTags
    .filter((t) => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t))
    .slice(0, 5);

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      onChange([...tags, clean]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div
        className="flex min-h-9 flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              aria-label={`Remove tag ${tag}`}
              className="rounded-full hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length === 0 ? 'Add tag…' : ''}
          className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Tag input"
          aria-autocomplete="list"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover py-1 shadow-md"
          role="listbox"
        >
          {suggestions.map((s) => (
            <li key={s}>
              <button
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(s);
                }}
                role="option"
                aria-selected={false}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
