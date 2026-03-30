'use client';

import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useNotesStore } from '@/stores/notes.store';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { downloadJSON, downloadMarkdownZip } from '@/lib/utils/export';
import { readFileAsJSON, parseExportBundle } from '@/lib/utils/import';
import { getStorageAdapter } from '@/lib/storage/factory';
import { Settings, Sun, Moon, Monitor } from 'lucide-react';

export function SettingsDrawer() {
  const { setTheme, theme } = useTheme();
  const { preferences, setPreference, resetPreferences } = usePreferencesStore();
  const { allNotes, loadAll } = useNotesStore();
  const [storageInfo, setStorageInfo] = useState<{ usedBytes: number; noteCount: number } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStorageInfo = async () => {
    const info = await getStorageAdapter().getStorageInfo();
    setStorageInfo(info);
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure? This will permanently delete all notes and settings.')) return;
    await getStorageAdapter().clearAll();
    await resetPreferences();
    await loadAll();
    setStorageInfo(null);
  };

  const handleExportJSON = async () => {
    const bundle = await getStorageAdapter().exportAll();
    downloadJSON(bundle);
  };

  const handleExportMarkdown = async () => {
    await downloadMarkdownZip(allNotes);
  };

  const handleImport = async (file: File) => {
    setImportError('');
    try {
      const raw = await readFileAsJSON(file);
      const { bundle, errors } = parseExportBundle(raw);
      if (!bundle) {
        setImportError('Invalid file: ' + errors.slice(0, 2).join('; '));
        return;
      }
      await getStorageAdapter().importBundle(bundle, importMode);
      await loadAll();
    } catch (e) {
      setImportError(String(e));
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open settings" onClick={loadStorageInfo}>
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Theme */}
          <section>
            <h3 className="mb-3 text-sm font-medium">Theme</h3>
            <div className="flex gap-2">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  variant={theme === value ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => setTheme(value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Editor mode */}
          <section>
            <h3 className="mb-3 text-sm font-medium">Editor mode</h3>
            <div className="flex gap-2">
              {(['markdown', 'richtext'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={preferences.editorMode === mode ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setPreference('editorMode', mode)}
                >
                  {mode === 'markdown' ? 'Markdown' : 'Rich text'}
                </Button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Default language */}
          <section>
            <Label htmlFor="default-lang" className="mb-2 block text-sm font-medium">
              Default language
            </Label>
            <select
              id="default-lang"
              value={preferences.defaultLanguage}
              onChange={(e) => setPreference('defaultLanguage', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिंदी</option>
              <option value="ja">日本語</option>
              <option value="ar">العربية</option>
              <option value="zh">中文</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
            </select>
          </section>

          <Separator />

          {/* AI Settings */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">AI Assistant</h3>
              <Switch
                checked={preferences.aiEnabled}
                onCheckedChange={(val) => setPreference('aiEnabled', val)}
                aria-label="Enable AI assistant"
              />
            </div>
            {preferences.aiEnabled && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ai-endpoint" className="mb-1 block text-xs">API endpoint</Label>
                  <input
                    id="ai-endpoint"
                    type="url"
                    value={preferences.aiEndpoint ?? ''}
                    onChange={(e) => setPreference('aiEndpoint', e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <Label htmlFor="ai-model" className="mb-1 block text-xs">Model</Label>
                  <input
                    id="ai-model"
                    type="text"
                    value={preferences.aiModel ?? ''}
                    onChange={(e) => setPreference('aiModel', e.target.value)}
                    placeholder="gpt-4o-mini"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <Label htmlFor="ai-key" className="mb-1 block text-xs">API key</Label>
                  <input
                    id="ai-key"
                    type="password"
                    value={preferences.aiApiKey ?? ''}
                    onChange={(e) => setPreference('aiApiKey', e.target.value)}
                    placeholder="sk-…"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            )}
          </section>

          <Separator />

          {/* Export / Import */}
          <section>
            <h3 className="mb-3 text-sm font-medium">Export</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleExportJSON}>
                JSON
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleExportMarkdown}>
                Markdown
              </Button>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium">Import</h3>
            <div className="mb-2 flex gap-2">
              {(['merge', 'overwrite'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={importMode === mode ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 capitalize"
                  onClick={() => setImportMode(mode)}
                >
                  {mode}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              Select JSON file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = '';
              }}
            />
            {importError && (
              <p className="mt-2 text-xs text-destructive">{importError}</p>
            )}
          </section>

          <Separator />

          {/* Storage info */}
          <section>
            <h3 className="mb-3 text-sm font-medium">Storage</h3>
            {storageInfo ? (
              <div className="mb-3 rounded-md bg-muted p-3 text-xs">
                <p>{storageInfo.noteCount} notes</p>
                <p>{formatBytes(storageInfo.usedBytes)} used</p>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="mb-3 w-full" onClick={loadStorageInfo}>
                Check storage
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleClearAll}
            >
              Clear all data
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
