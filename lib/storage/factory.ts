import type { StorageAdapter } from './adapter';
import type { StorageAdapterType } from '@/types';

let _adapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (_adapter) return _adapter;

  const type =
    (process.env.NEXT_PUBLIC_STORAGE_ADAPTER as StorageAdapterType) ?? 'localstorage';

  if (type === 'indexeddb' && typeof indexedDB !== 'undefined') {
    const { IndexedDBAdapter } = require('./indexeddb');
    _adapter = new IndexedDBAdapter();
  } else {
    const { LocalStorageAdapter } = require('./localstorage');
    _adapter = new LocalStorageAdapter();
  }

  return _adapter!;
}
