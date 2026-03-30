export type EditorMode = 'markdown' | 'richtext';
export type Theme = 'light' | 'dark' | 'system';
export type StorageAdapterType = 'localstorage' | 'indexeddb' | 'remote';

export interface AIContext {
  summarySnippet?: string;
  embeddingVector?: number[];
  lastQueriedAt?: string;
}

export interface Note {
  id: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  language: string;
  content: string;
  contentHtml?: string;
  tags: string[];
  title?: string;
  pinned: boolean;
  archived: boolean;
  wordCount: number;
  aiContext?: AIContext;
}

export interface TagIndex {
  [tag: string]: string[];
}

export interface UserPreferences {
  defaultLanguage: string;
  theme: Theme;
  editorMode: EditorMode;
  uiLocale: string;
  aiEnabled: boolean;
  aiEndpoint?: string;
  aiModel?: string;
  aiApiKey?: string;
  aiConsentGiven?: boolean;
  storageAdapter: StorageAdapterType;
  remoteBaseUrl?: string;
}

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  notes: Note[];
  preferences?: UserPreferences;
}

export interface SearchResult {
  item: Note;
  score?: number;
  matches?: Array<{
    key?: string;
    indices: ReadonlyArray<[number, number]>;
    value?: string;
  }>;
}
