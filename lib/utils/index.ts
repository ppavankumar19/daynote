import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const RTL_LANGS = ['ar', 'he', 'fa', 'ur', 'yi', 'dv', 'ps', 'sd'];

export function isRTL(lang: string): boolean {
  const primary = lang.split('-')[0].toLowerCase();
  return RTL_LANGS.includes(primary);
}

export function computeWordCount(markdown: string): number {
  if (!markdown.trim()) return 0;
  // Strip markdown syntax
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, '') // fenced code blocks
    .replace(/`[^`]+`/g, '')         // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[.*?\]\(.*?\)/g, '')  // links
    .replace(/[#*_~>|-]/g, '')       // md symbols
    .trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}

export function inferTitle(content: string): string {
  if (!content.trim()) return '';
  // Try first ATX heading
  const headingMatch = content.match(/^#{1,6}\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  // Fall back to first 60 chars
  const firstLine = content.split('\n')[0].replace(/[#*_~]/g, '').trim();
  return firstLine.length > 60 ? firstLine.slice(0, 60) + '…' : firstLine;
}

export function formatDisplayDate(iso: string, locale = 'en'): string {
  try {
    const date = new Date(iso + 'T00:00:00');
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return iso;
  }
}

export function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4; // rough 4 chars per token
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}
