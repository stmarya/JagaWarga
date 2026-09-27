import { beforeEach, describe, expect, it } from 'vitest';
import { addHistory, clearAllLocalData, exportLocalData, getHistory } from './storage';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
});

describe('local storage schema', () => {
  it('migrates v1 history without data loss', () => {
    localStorage.setItem('jagawarga:history:v1', JSON.stringify([{
      id: 'one', type: 'domain', displayValue: 'example.com', verdict: 'insufficient-data', checkedAt: new Date(0).toISOString(),
    }]));
    expect(getHistory()).toHaveLength(1);
    expect(localStorage.getItem('jagawarga:history:v1')).toBeNull();
    expect(localStorage.getItem('jagawarga:history:v2')).toContain('example.com');
  });

  it('exports a versioned payload and deletes every schema generation', () => {
    addHistory({ id: 'two', type: 'domain', displayValue: 'example.org', verdict: 'high-risk', checkedAt: new Date().toISOString() });
    expect(JSON.parse(exportLocalData())).toMatchObject({ schemaVersion: 2 });
    clearAllLocalData();
    expect(getHistory()).toEqual([]);
  });
});