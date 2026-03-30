import Fuse from 'fuse.js';
import type { Note } from '@/types';
import { truncateToTokens } from '@/lib/utils';

export function buildAIContext(query: string, notes: Note[], maxTokens = 3000): string {
  const fuse = new Fuse(notes, {
    keys: ['content', 'title'],
    threshold: 0.4,
    ignoreLocation: true,
  });

  const matches = fuse.search(query, { limit: 10 });

  const excerpts = matches.map((m) => ({
    date: m.item.date,
    tags: m.item.tags.join(', '),
    text: m.item.content.slice(0, 400),
  }));

  let totalChars = 0;
  const maxChars = maxTokens * 4;
  const included: typeof excerpts = [];

  for (const e of excerpts) {
    const chars = e.text.length + e.date.length + e.tags.length + 40;
    if (totalChars + chars > maxChars) break;
    included.push(e);
    totalChars += chars;
  }

  if (included.length === 0) return '';

  return included
    .map(
      (e) =>
        `--- Note: ${e.date}${e.tags ? ` | Tags: ${e.tags}` : ''} ---\n${e.text}\n---`
    )
    .join('\n\n');
}

export function buildSystemPrompt(): string {
  return `You are a personal assistant with access to the user's notes.
Answer questions strictly based on the provided note excerpts.
If the answer is not in the notes, say so clearly.
Cite note dates when referencing specific notes.
Do not fabricate information.`;
}
