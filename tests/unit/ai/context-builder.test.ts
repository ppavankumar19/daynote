import { describe, it, expect } from 'vitest';
import { buildAIContext, buildSystemPrompt } from '@/lib/ai/context-builder';
import type { Note } from '@/types';

function makeNote(id: string, content: string, date = '2025-03-25'): Note {
  return {
    id,
    date,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    language: 'en',
    content,
    tags: [],
    pinned: false,
    archived: false,
    wordCount: content.split(' ').length,
  };
}

describe('buildAIContext', () => {
  it('returns empty string when no notes match', () => {
    const notes = [makeNote('1', 'unrelated content about cooking')];
    const ctx = buildAIContext('programming typescript', notes);
    expect(ctx).toBe('');
  });

  it('includes relevant note excerpt', () => {
    const notes = [
      makeNote('1', 'TypeScript TypeScript TypeScript typed superset JavaScript programming'),
      makeNote('2', 'Today I cooked pasta for dinner'),
    ];
    const ctx = buildAIContext('TypeScript', notes);
    expect(ctx).toContain('TypeScript');
  });

  it('truncates to maxTokens', () => {
    const longContent = 'word '.repeat(2000);
    const notes = [makeNote('1', longContent)];
    const ctx = buildAIContext('word', notes, 100);
    expect(ctx.length).toBeLessThan(100 * 4 + 200); // some overhead for metadata
  });

  it('includes note date in output', () => {
    const notes = [makeNote('1', 'async await is great for TypeScript', '2025-01-15')];
    const ctx = buildAIContext('async TypeScript', notes);
    expect(ctx).toContain('2025-01-15');
  });
});

describe('buildSystemPrompt', () => {
  it('returns a non-empty system prompt', () => {
    expect(buildSystemPrompt().length).toBeGreaterThan(50);
  });

  it('instructs not to fabricate', () => {
    expect(buildSystemPrompt().toLowerCase()).toContain('fabricate');
  });
});
