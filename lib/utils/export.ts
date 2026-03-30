import type { ExportBundle, Note } from '@/types';
import { todayISO } from '@/lib/utils';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJSON(bundle: ExportBundle): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `daynote-export-${todayISO()}.json`);
}

export async function downloadMarkdownZip(notes: Note[]): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const note of notes) {
    const filename = `${note.date}-${note.id.slice(0, 8)}.md`;
    const frontmatter = [
      '---',
      `date: ${note.date}`,
      `language: ${note.language}`,
      `tags: [${note.tags.join(', ')}]`,
      `pinned: ${note.pinned}`,
      '---',
      '',
    ].join('\n');
    zip.file(filename, frontmatter + note.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, `daynote-notes-${todayISO()}.zip`);
}
