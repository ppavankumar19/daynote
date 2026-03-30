import { describe, it, expect } from 'vitest';
import { computeWordCount } from '@/lib/utils';

describe('computeWordCount', () => {
  it('counts basic words', () => expect(computeWordCount('hello world')).toBe(2));
  it('returns 0 for empty string', () => expect(computeWordCount('')).toBe(0));
  it('strips markdown headings', () => expect(computeWordCount('# Hello World')).toBe(2));
  it('strips inline code', () => expect(computeWordCount('use `const x = 1` here')).toBe(2));
  it('strips fenced code blocks', () => {
    expect(computeWordCount('before\n```\ncode here\n```\nafter')).toBe(2);
  });
  it('handles multiple spaces', () => expect(computeWordCount('  hello   world  ')).toBe(2));
  it('handles newlines', () => expect(computeWordCount('line one\nline two')).toBe(4));
});
