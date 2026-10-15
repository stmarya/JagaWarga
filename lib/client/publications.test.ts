import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deletePublication, getPublicationReceipts, savePublicationReceipt } from './publications';
class MemoryStorage { values = new Map<string, string>(); getItem(k: string) { return this.values.get(k) ?? null; } setItem(k: string, v: string) { this.values.set(k, v); } }
const receipt = () => ({ id: '00000000-0000-4000-8000-000000000001', deletionToken: 'e'.repeat(64), expiresAt: new Date(Date.now() + 10000).toISOString() });
beforeEach(() => { vi.stubGlobal('localStorage', new MemoryStorage()); });
afterEach(() => vi.unstubAllGlobals());
describe('private publication receipts', () => {
  it('ignores expired and malformed capabilities', () => {
    localStorage.setItem('jagawarga:community-receipts:v1', JSON.stringify([{ ...receipt(), expiresAt: new Date(0).toISOString() }, { id: 'bad' }]));
    expect(getPublicationReceipts()).toEqual([]);
  });
  it('retains the capability after a server deletion failure', async () => {
    const r = receipt(); savePublicationReceipt(r); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));
    await expect(deletePublication(r)).rejects.toThrow(); expect(getPublicationReceipts()).toEqual([r]);
  });
  it('removes the local capability only after server-confirmed deletion', async () => {
    const r = receipt(); savePublicationReceipt(r); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"deleted":true}')));
    await deletePublication(r); expect(getPublicationReceipts()).toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/history', expect.objectContaining({ method: 'DELETE' }));
  });
});
