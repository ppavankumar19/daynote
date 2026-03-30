import { z } from 'zod';
import type { ExportBundle } from '@/types';

const NoteSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.string(),
  updatedAt: z.string(),
  language: z.string().default('en'),
  content: z.string(),
  contentHtml: z.string().optional(),
  tags: z.array(z.string()).default([]),
  title: z.string().optional(),
  pinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  wordCount: z.number().default(0),
  aiContext: z
    .object({
      summarySnippet: z.string().optional(),
      lastQueriedAt: z.string().optional(),
    })
    .optional(),
});

const ExportBundleSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  notes: z.array(NoteSchema),
  preferences: z.any().optional(),
});

export function parseExportBundle(raw: unknown): {
  bundle: ExportBundle | null;
  errors: string[];
} {
  const result = ExportBundleSchema.safeParse(raw);
  if (result.success) {
    return { bundle: result.data as ExportBundle, errors: [] };
  }
  const errors = result.error.issues.map((e) => `${(e.path as (string | number | symbol)[]).map(String).join('.')}: ${e.message}`);
  return { bundle: null, errors };
}

export function readFileAsJSON(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target?.result as string));
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
