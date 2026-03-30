'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useNotesStore } from '@/stores/notes.store';
import { usePreferencesStore } from '@/stores/preferences.store';
import { TagInput } from './tag-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isRTL } from '@/lib/utils';
import type { Note } from '@/types';
import {
  Pin,
  PinOff,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';

const MarkdownEditor = dynamic(
  () => import('@/components/editor/markdown-editor').then((m) => m.MarkdownEditor),
  { ssr: false }
);

const RichTextEditor = dynamic(
  () => import('@/components/editor/rich-text-editor').then((m) => m.RichTextEditor),
  { ssr: false }
);

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ja', label: '日本語' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
];

interface NoteCardProps {
  note: Note;
  autoFocus?: boolean;
}

export function NoteCard({ note, autoFocus }: NoteCardProps) {
  const { updateNote, deleteNote, pinNote, archiveNote } = useNotesStore();
  const editorMode = usePreferencesStore((s) => s.preferences.editorMode);

  const [content, setContent] = useState(note.content);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lang, setLang] = useState(note.language);
  const [tags, setTags] = useState(note.tags);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when note changes externally
  useEffect(() => {
    setContent(note.content);
    setLang(note.language);
    setTags(note.tags);
  }, [note.id]);

  const scheduleAutoSave = useCallback(
    (newContent: string, newTags?: string[], newLang?: string) => {
      setIsDirty(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        await updateNote(note.id, {
          content: newContent,
          tags: newTags ?? tags,
          language: newLang ?? lang,
        });
        setIsDirty(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }, 800);
    },
    [note.id, updateNote, tags, lang]
  );

  const handleContentChange = (val: string) => {
    setContent(val);
    scheduleAutoSave(val);
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    scheduleAutoSave(content, newTags);
  };

  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    scheduleAutoSave(content, tags, newLang);
  };

  // Manual save Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        updateNote(note.id, { content, tags, language: lang }).then(() => {
          setIsDirty(false);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [note.id, content, tags, lang, updateNote]);

  const rtl = isRTL(lang);

  return (
    <article
      lang={lang}
      dir={rtl ? 'rtl' : 'ltr'}
      className="flex flex-col rounded-lg border bg-card shadow-sm"
      style={{ isolation: 'isolate' }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <select
            value={lang}
            onChange={(e) => handleLangChange(e.target.value)}
            className="rounded border border-input bg-background px-1.5 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Note language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          {/* Save status */}
          <span
            role="status"
            aria-live="polite"
            className="text-xs text-muted-foreground"
            aria-label="Save status"
          >
            {isDirty && '● Unsaved'}
            {isSaved && !isDirty && '✓ Saved'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Preview toggle (markdown mode only) */}
          {editorMode === 'markdown' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowPreview((p) => !p)}
              aria-label={showPreview ? 'Edit' : 'Preview'}
              title={showPreview ? 'Edit (Ctrl+P)' : 'Preview (Ctrl+P)'}
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => pinNote(note.id, !note.pinned)}
            aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            {note.pinned ? (
              <PinOff className="h-3.5 w-3.5" />
            ) : (
              <Pin className="h-3.5 w-3.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => archiveNote(note.id, !note.archived)}
            aria-label={note.archived ? 'Unarchive note' : 'Archive note'}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm('Delete this note?')) deleteNote(note.id);
            }}
            aria-label="Delete note"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor area */}
      <div className="min-h-[200px] flex-1">
        {showPreview && editorMode === 'markdown' ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none px-4 py-3"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : editorMode === 'richtext' ? (
          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            lang={lang}
          />
        ) : (
          <MarkdownEditor
            value={content}
            onChange={handleContentChange}
            lang={lang}
          />
        )}
      </div>

      {/* Tags footer */}
      <div className="border-t px-3 py-2">
        <TagInput tags={tags} onChange={handleTagsChange} />
      </div>

      {/* Metadata footer */}
      <div className="flex items-center justify-between border-t px-3 py-1 text-xs text-muted-foreground">
        <span>{note.wordCount} words</span>
        <span>{new Date(note.updatedAt).toLocaleTimeString()}</span>
      </div>
    </article>
  );
}
