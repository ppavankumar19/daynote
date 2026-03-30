'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTheme } from 'next-themes';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  lang?: string;
  readOnly?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  lang = 'en',
  readOnly = false,
}: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { resolvedTheme } = useTheme();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const buildExtensions = useCallback(
    (isDark: boolean) => [
      history(),
      markdown(),
      EditorView.lineWrapping,
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorView.editable.of(!readOnly),
      ...(isDark ? [oneDark] : []),
      EditorView.theme({
        '&': { height: '100%', backgroundColor: 'transparent' },
        '.cm-content': { padding: '12px 0', fontFamily: 'inherit' },
        '.cm-line': { padding: '0 16px' },
        '.cm-placeholder': { color: 'var(--cm-placeholder, #9ca3af)' },
      }),
    ],
    [readOnly]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = resolvedTheme === 'dark';
    const state = EditorState.create({
      doc: value,
      extensions: buildExtensions(isDark),
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount and theme change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme]);

  // Sync external value changes (e.g. switching notes)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-auto"
      lang={lang}
      aria-label="Markdown editor"
      role="textbox"
      aria-multiline="true"
    />
  );
}
