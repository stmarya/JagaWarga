export type PublicationReceipt = { id: string; deletionToken: string; expiresAt: string };
const KEY = 'jagawarga:community-receipts:v1';
export function getPublicationReceipts(): PublicationReceipt[] {
  try {
    const rows = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(rows) ? rows.filter((r) => r && typeof r.id === 'string'
      && /^[a-f0-9-]{36}$/i.test(r.id) && /^[a-f0-9]{64}$/i.test(r.deletionToken)
      && Date.parse(r.expiresAt) > Date.now()).slice(0, 200) : [];
  } catch { return []; }
}
export function savePublicationReceipt(receipt: PublicationReceipt) {
  localStorage.setItem(KEY, JSON.stringify([receipt, ...getPublicationReceipts().filter((r) => r.id !== receipt.id)].slice(0, 200)));
}
export function forgetPublicationReceipt(id: string) {
  localStorage.setItem(KEY, JSON.stringify(getPublicationReceipts().filter((r) => r.id !== id)));
}
export async function deletePublication(receipt: PublicationReceipt) {
  const response = await fetch('/api/history', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: receipt.id, deletionToken: receipt.deletionToken }),
  });
  if (!response.ok) throw new Error(response.status === 404
    ? 'Publikasi tidak tersedia atau bukti penghapusan tidak cocok. Record kedaluwarsa otomatis maksimal 24 jam.'
    : 'Penghapusan server belum berhasil. Coba lagi sebelum menghapus bukti lokal.');
  forgetPublicationReceipt(receipt.id);
}