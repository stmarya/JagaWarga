import { boundedText, readSnapshot, timestamp, type LookupSnapshot } from './snapshot';

export const CASE_DB = 'jagawarga-analyst-v1';
export type InvestigationCase = {
  id: string; title: string; summary: string; notes: string; conclusion: string;
  status: 'open' | 'investigating' | 'closed';
  createdAt: string; updatedAt: string; snapshots: LookupSnapshot[];
};
export function validateCase(value: unknown): InvestigationCase {
  if (!value || typeof value !== 'object') throw new Error('Kasus tidak valid.');
  const c = value as Record<string, unknown>;
  if (!['open', 'investigating', 'closed'].includes(String(c.status))) throw new Error('Status tidak valid.');
  if (!Array.isArray(c.snapshots) || c.snapshots.length > 100) throw new Error('Maksimal 100 snapshot per kasus.');
  const id = boundedText(c.id, 100);
  if (!/^[a-z0-9-]+$/i.test(id)) throw new Error('ID tidak valid.');
  const title = boundedText(c.title, 200).trim();
  if (!title) throw new Error('Judul wajib diisi.');
  return {
    id, title, summary: boundedText(c.summary, 4000), notes: boundedText(c.notes, 8000),
    conclusion: boundedText(c.conclusion, 4000), status: c.status as InvestigationCase['status'],
    createdAt: timestamp(c.createdAt), updatedAt: timestamp(c.updatedAt), snapshots: c.snapshots.map(readSnapshot),
  };
}
export function parseCaseImport(text: string): InvestigationCase {
  if (new TextEncoder().encode(text).length > 1024 * 1024) throw new Error('Paket kasus maksimal 1 MB.');
  const value = JSON.parse(text);
  if (value.schemaVersion !== 1 || value.kind !== 'jagawarga-case') throw new Error('Versi paket tidak didukung.');
  return validateCase(value.case);
}
export function casePackage(c: InvestigationCase) {
  const packet = { schemaVersion: 1, kind: 'jagawarga-case', case: validateCase(c) };
  if (new TextEncoder().encode(JSON.stringify(packet)).length > 1024 * 1024) throw new Error('Paket melebihi 1 MB; kurangi snapshot sebelum ekspor.');
  return packet;
}
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CASE_DB, 1);
    let blocked = false;
    request.onupgradeneeded = () => request.result.createObjectStore('cases', { keyPath: 'id' });
    request.onsuccess = () => { if (blocked) request.result.close(); else resolve(request.result); };
    request.onerror = () => reject(new Error('Penyimpanan lokal tidak tersedia.'));
    request.onblocked = () => { blocked = true; reject(new Error('Tutup tab JagaWarga lain lalu coba lagi.')); };
  });
}
async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cases', mode);
    const request = action(tx.objectStore('cases'));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(new Error('Gagal menyimpan kasus. Periksa ruang penyimpanan browser.')); };
  });
}
export async function listCases() {
  const rows = await transaction<InvestigationCase[]>('readonly', (store) => store.getAll());
  return rows.map(validateCase).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function saveCase(c: InvestigationCase, expectedUpdatedAt = c.updatedAt, requireExisting = false) {
  const safe = validateCase(c);
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('cases', 'readwrite');
    const store = tx.objectStore('cases');
    const current = store.get(safe.id);
    let conflict = false;
    current.onsuccess = () => {
      if ((!current.result && requireExisting) || (current.result && current.result.updatedAt !== expectedUpdatedAt)) {
        conflict = true; tx.abort(); return;
      }
      store.put(safe);
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(new Error(conflict ? 'Kasus berubah di tab lain. Muat ulang sebelum menyimpan.' : 'Gagal menyimpan kasus lokal.'));
    };
  });
}
export async function deleteCase(id: string) {
  await transaction('readwrite', (store) => store.delete(id));
}
export async function deleteAllCases() {
  await transaction('readwrite', (store) => store.clear());
}