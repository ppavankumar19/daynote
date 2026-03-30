import { describe, it, expect } from 'vitest';
import { isRTL } from '@/lib/utils';

describe('isRTL', () => {
  it('returns true for Arabic', () => expect(isRTL('ar')).toBe(true));
  it('returns true for Hebrew', () => expect(isRTL('he')).toBe(true));
  it('returns true for Farsi', () => expect(isRTL('fa')).toBe(true));
  it('returns true for Urdu', () => expect(isRTL('ur')).toBe(true));
  it('returns true for ar-SA', () => expect(isRTL('ar-SA')).toBe(true));
  it('returns false for English', () => expect(isRTL('en')).toBe(false));
  it('returns false for Telugu', () => expect(isRTL('te')).toBe(false));
  it('returns false for Japanese', () => expect(isRTL('ja')).toBe(false));
  it('returns false for Hindi', () => expect(isRTL('hi')).toBe(false));
  it('returns false for Chinese', () => expect(isRTL('zh')).toBe(false));
});
