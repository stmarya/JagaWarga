import { beforeEach, describe, expect, it } from 'vitest';
import { addHistory, clearAllLocalData, clearHistory, exportLocalData, getHistory, remembersHistory, setRememberHistory } from './storage';

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
  it('defaults to session-only history, with an explicit local opt-in', () => {
    expect(remembersHistory()).toBe(false);
    setRememberHistory(true); expect(remembersHistory()).toBe(true);
    clearAllLocalData(); expect(remembersHistory()).toBe(false);
  });
  it('clears both history versions and preserves other data until clear-all', () => {
    localStorage.setItem('jagawarga:history:v1', '[]');
    clearHistory(); expect(localStorage.getItem('jagawarga:history:v1')).toBeNull();
    localStorage.setItem('jagawarga:community-receipts:v1', '[]');
    localStorage.setItem('jagawarga:history', '[]');
    localStorage.setItem('jagawarga:user-xp', '2');
    expect(JSON.parse(exportLocalData()).legacy).toMatchObject({ history: [], xp: 2 });
    clearAllLocalData(); expect(localStorage.getItem('jagawarga:community-receipts:v1')).toBeNull();
    expect(localStorage.getItem('jagawarga:history')).toBeNull();
  });
  it('handles a corrupt history payload without crashing the dashboard', () => {
    localStorage.setItem('jagawarga:history:v2', '{"wrong":"shape"}');
    expect(getHistory()).toEqual([]);
  });
});
describe('explicit local learning completion',()=>{
 it('is idempotent across reload-style reads and preserves completion on XP changes',async()=>{const {completeEducation,getProgress,addXp}=await import('./storage');completeEducation('phishing');completeEducation('phishing');expect(getProgress()).toMatchObject({xp:50,completedTopics:['phishing']});addXp(10);expect(getProgress()).toMatchObject({xp:60,completedTopics:['phishing']});});
 it('exports and clears learning markers with existing privacy controls',async()=>{const {completeEducation,getProgress}=await import('./storage');completeEducation('privacy');expect(JSON.parse(exportLocalData()).progress.completedTopics).toEqual(['privacy']);clearAllLocalData();expect(getProgress().completedTopics).toEqual([]);});
 it('rejects malformed IDs, bounds records and surfaces storage refusal',async()=>{const {completeEducation}=await import('./storage');expect(()=>completeEducation('../x')).toThrow();localStorage.setItem('jagawarga:progress:v2',JSON.stringify({xp:0,badges:[],completedTopics:Array.from({length:100},(_,i)=>`topic-${i}`)}));expect(()=>completeEducation('extra')).toThrow('Batas');Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{throw new Error('blocked');}}});expect(()=>completeEducation('privacy')).toThrow('blocked');});
});
