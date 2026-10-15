import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:3010'; const shots = process.env.QA_DIR;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--no-sandbox'] });
const now = new Date().toISOString(); let serial = 0;
const snapshot = (indicator) => ({ indicator: { type: 'domain', displayValue: indicator }, risk: 60, verdict: 'suspicious', confidence: 'medium', checkedAt: now, requestId: `batch3-${++serial}`, scoringVersion: 'severity-independent-v1', coverage: { requested: 2, assessed: 1, failed: 1 }, conflictingEvidence: true, evidence: [{ provider: 'fixture-reputation', verdict: 'suspicious', confidence: .6, observedAt: null, fetchedAt: now, freshness: 'stale', reasonCodes: ['FIXTURE'], details: { secret: 'DO_NOT_EXPORT' } }] });
try {
 const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
 const errors = []; const writes = []; let activeTrace = false; let patternMode = 'success'; let complete = false;
 await context.route('**/api/**', async (route) => {
  const r = route.request(); const path = new URL(r.url()).pathname; if (r.method() !== 'GET') writes.push(path);
  if (path === '/api/policy') { await route.fulfill({ json: { features: { activeRedirects: activeTrace, communityReporting: false } } }); return; }
  if (path === '/api/lookups') { await route.fulfill({ json: snapshot(r.postDataJSON().indicator) }); return; }
  if (path.startsWith('/api/analyze/')) {
   if (patternMode === 'network') { await route.abort(); return; }
   if (patternMode === 'malformed') { await route.fulfill({ json: {} }); return; }
   if (patternMode === 'slow') await new Promise((resolve) => setTimeout(resolve, 500));
   const header = path.endsWith('email-header');
   await route.fulfill({ json: { risk: header ? 75 : 55, verdict: 'suspicious', reasonCodes: header ? ['DMARC_FAIL', 'FROM_REPLY_TO_MISMATCH'] : ['CREDENTIAL_REQUEST', 'URGENCY'], actions: [], requestId: `pattern-${++serial}`, ...(header ? { authentication: { spf: 'pass', dkim: 'fail', dmarc: 'fail' } } : {}), text: 'RAW_INPUT_NOT_FOR_EXPORT' } }); return;
  }
  if (path === '/api/tools/unshorten') { assert.equal(r.postDataJSON().consent, true); await route.fulfill({ json: { originalUrl: 'https://example.org', completed: complete, finalUrl: complete ? 'https://example.org/final' : null, stopReason: complete ? 'HEAD_COMPLETE' : 'HTTP_NOT_COMPLETE', hops: [{ url: 'https://example.org/', status: complete ? 200 : 405 }] } }); return; }
  await route.fulfill({ json: [] });
 });
 async function pageAt(path) { const p = await context.newPage(); p.on('pageerror', (e) => errors.push(`${new URL(p.url()).pathname}: ${e.message}`)); p.on('dialog', (d) => d.accept()); await p.goto(`${base}${path}`); return p; }
 async function inspect(p, label, capture = true) {
  const violations = (await new AxeBuilder({ page: p }).analyze()).violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  assert.deepEqual(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], label);
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${label} overflow`);
  assert.equal(await p.locator('h1').count(), 1);
  if (shots && capture) { await mkdir(shots, { recursive: true }); await p.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); }); await p.waitForTimeout(200); await p.screenshot({ path: `${shots}/${label}.png`, fullPage: true, animations: 'disabled' }); }
 }
 async function openCase(p, title) { await p.getByRole('button', { name: title, exact: true }).click(); await p.locator('#case-title').waitFor(); }
 async function exportCase(p) { const d = p.waitForEvent('download'); await p.getByRole('button', { name: 'Ekspor paket kasus', exact: true }).click(); return JSON.parse(await readFile(await (await d).path(), 'utf8')); }
 const p = await pageAt('/analyst/cases');
 await p.getByRole('button', { name: 'Kasus baru', exact: true }).click(); await p.locator('#case-title').fill('Kasus konflik'); await p.getByRole('button', { name: 'Simpan kasus lokal', exact: true }).click(); await p.getByRole('status').filter({ hasText: 'Kasus disimpan' }).waitFor();
 assert.equal(await p.getByRole('button', { name: 'Simpan kasus lokal', exact: true }).isDisabled(), true, 'clean saved form');
 const other = await pageAt('/analyst/cases'); await openCase(other, 'Kasus konflik');
 await p.locator('#case-notes').fill('Versi pertama tersimpan'); await p.getByRole('button', { name: 'Simpan kasus lokal', exact: true }).click(); await p.getByRole('status').filter({ hasText: 'Kasus disimpan' }).waitFor();
 await other.locator('#case-notes').fill('Versi kedua yang belum disimpan'); await other.getByRole('button', { name: 'Simpan kasus lokal', exact: true }).click(); await other.getByRole('status').filter({ hasText: 'Kasus berubah di tab lain' }).waitFor();
 assert.equal(await other.locator('#case-notes').inputValue(), 'Versi kedua yang belum disimpan');
 await other.getByText('Muat ulang atau hapus kasus', { exact: true }).click(); await other.getByRole('button', { name: 'Muat ulang versi tersimpan', exact: true }).click(); await other.getByRole('status').filter({ hasText: 'Versi tersimpan terbaru dimuat' }).waitFor(); assert.equal(await other.locator('#case-notes').inputValue(), 'Versi pertama tersimpan');
 await p.getByText('Muat ulang atau hapus kasus', { exact: true }).click(); await p.getByRole('button', { name: 'Hapus kasus ini', exact: true }).click(); await p.getByRole('status').filter({ hasText: 'Kasus lokal dihapus' }).waitFor();
 await other.locator('#case-notes').fill('Jangan hidupkan ulang kasus terhapus'); await other.getByRole('button', { name: 'Simpan kasus lokal', exact: true }).click(); await other.getByRole('status').filter({ hasText: 'Kasus berubah di tab lain' }).waitFor();
 await p.reload(); await p.getByText('Belum ada kasus tersimpan.', { exact: true }).waitFor();
 await other.close();
 await p.getByRole('button', { name: 'Kasus baru', exact: true }).click(); await p.locator('#case-title').fill('Investigasi Batch 3'); await p.getByRole('button', { name: 'Simpan kasus lokal', exact: true }).click(); await p.getByRole('status').filter({ hasText: 'Kasus disimpan' }).waitFor();
 await p.locator('#case-search').fill('tidak-ada'); await p.getByText('Tidak ada kasus yang cocok. Ubah pencarian atau filter.').waitFor(); await p.locator('#case-search').fill(''); await inspect(p, 'cases-editor-mobile');
 const casePage = p;
 const triage = await pageAt('/analyst'); await triage.locator('#batch-input').fill('one.example.org\ntwo.example.org'); await triage.getByRole('button', { name: 'Preview lokal', exact: true }).click(); await triage.getByLabel(/Saya menyetujui/).check(); await triage.getByRole('button', { name: 'Mulai / lanjutkan lookup', exact: true }).click(); await triage.getByRole('status').filter({ hasText: 'Batch selesai' }).waitFor();
 await triage.getByRole('button', { name: 'Lihat bukti 1', exact: true }).click(); assert.equal(await triage.locator('.evidence-selection-heading').evaluate((el) => el === document.activeElement), true);
 await triage.locator('#case-select').selectOption({ label: 'Investigasi Batch 3' }); await triage.getByRole('button', { name: 'Simpan evidence ke kasus', exact: true }).click(); await triage.getByRole('status').filter({ hasText: '1 evidence tersimpan' }).waitFor();
 await casePage.reload(); await openCase(casePage, 'Investigasi Batch 3'); assert.equal((await exportCase(casePage)).case.snapshots.length, 1, 'selected scope saves exactly one');
 await triage.locator('#attach-scope').selectOption('batch'); await triage.getByRole('button', { name: 'Simpan evidence ke kasus', exact: true }).click(); await triage.getByRole('status').filter({ hasText: '1 evidence tersimpan' }).waitFor();
 await triage.getByRole('button', { name: 'Simpan evidence ke kasus', exact: true }).click(); await triage.getByRole('status').filter({ hasText: 'tidak ada duplikasi' }).waitFor();
 await inspect(triage, 'triage-evidence-mobile');
 await casePage.reload(); await openCase(casePage, 'Investigasi Batch 3'); const packet = await exportCase(casePage); assert.equal(packet.case.snapshots.length, 2); assert.equal(JSON.stringify(packet).includes('DO_NOT_EXPORT'), false);
 await casePage.getByRole('button', { name: 'Lihat snapshot 1', exact: true }).click(); await inspect(casePage, 'cases-timeline-mobile');
 await casePage.getByRole('button', { name: 'Lepas snapshot 1', exact: true }).click(); await casePage.getByText('Ada perubahan belum disimpan. Simpan sebelum berpindah halaman.').waitFor(); await casePage.reload(); await openCase(casePage, 'Investigasi Batch 3'); assert.equal((await exportCase(casePage)).case.snapshots.length, 2, 'unsaved detach never persisted');
 // Same-window navigation must not silently discard a dirty case draft.
 await casePage.locator('#case-summary').fill('Draft belum disimpan');
 const dialogListeners = casePage.listeners('dialog'); casePage.removeAllListeners('dialog'); casePage.once('dialog', (d) => d.dismiss());
 await casePage.getByRole('link', { name: 'Bulk triage', exact: true }).click(); assert.equal(new URL(casePage.url()).pathname, '/analyst/cases'); assert.equal(await casePage.locator('#case-summary').inputValue(), 'Draft belum disimpan');
 for (const listener of dialogListeners) casePage.on('dialog', listener);
 await casePage.locator('#case-summary').fill('');
 const tool = await pageAt('/tools/message');
 await tool.getByRole('button', { name: 'Gunakan contoh', exact: true }).click(); patternMode = 'slow'; await tool.getByRole('button', { name: 'Analisis pesan', exact: true }).click(); assert.equal(await tool.locator('#message').isDisabled(), true); await tool.getByRole('heading', { name: 'Ada pola yang perlu ditinjau', exact: true }).waitFor();
 const analysisDownload = tool.waitForEvent('download'); await tool.getByRole('button', { name: 'Ekspor analisis JSON' }).click(); const analysis = await readFile(await (await analysisDownload).path(), 'utf8'); assert.equal(analysis.includes('RAW_INPUT_NOT_FOR_EXPORT'), false); await inspect(tool, 'message-mobile');
 await tool.locator('#message').fill('Input baru'); assert.equal(await tool.getByRole('heading', { name: 'Ada pola yang perlu ditinjau', exact: true }).count(), 0);
 patternMode = 'network'; await tool.getByRole('button', { name: 'Analisis pesan', exact: true }).click(); await tool.getByRole('status').filter({ hasText: /fetch|Koneksi|Failed/i }).waitFor();
 patternMode = 'malformed'; await tool.getByRole('button', { name: 'Analisis pesan', exact: true }).click(); await tool.getByRole('status').filter({ hasText: 'Respons analisis tidak valid' }).waitFor();
 patternMode = 'success'; await tool.goto(`${base}/tools/email-header`); await tool.getByRole('button', { name: 'Gunakan contoh', exact: true }).click(); await tool.getByRole('button', { name: 'Periksa email', exact: true }).click(); await tool.getByText(/Nilai pass tidak membuktikan/).waitFor(); await inspect(tool, 'email-header-mobile');
 const beforeLocal = writes.length;
 await tool.goto(`${base}/tools/file-hash`); await tool.locator('#file').setInputFiles({ name: 'safe-fixture.txt', mimeType: 'text/plain', buffer: Buffer.from('JagaWarga batch3 fixture') }); await tool.locator('#file-sha256').waitFor(); assert.match(await tool.locator('#file-sha256').inputValue(), /^[a-f0-9]{64}$/); assert.equal(writes.length, beforeLocal); await inspect(tool, 'file-hash-mobile');
 await tool.goto(`${base}/tools/qr`); await tool.evaluate(() => { window.BarcodeDetector = class { async detect() { return [{ rawValue: 'WIFI:S:private-network;T:WPA;P:not-for-server;;' }]; } }; });
 const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
 await tool.locator('#qr').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: png }); await tool.locator('#qr-value').waitFor(); assert.equal(await tool.getByRole('link', { name: 'Periksa tujuan ini', exact: true }).count(), 0); assert.equal(writes.length, beforeLocal); await inspect(tool, 'qr-local-mobile');
 await tool.evaluate(() => { window.BarcodeDetector = class { async detect() { return [{ rawValue: 'https://example.org/qr' }]; } }; }); await tool.locator('#qr').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: png }); await tool.getByRole('link', { name: 'Periksa tujuan ini', exact: true }).waitFor(); assert.match(await tool.getByRole('link', { name: 'Periksa tujuan ini' }).getAttribute('href'), /^\/periksa\?ioc=/);
 await tool.evaluate(() => { delete window.BarcodeDetector; }); await tool.locator('#qr').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: png }); await tool.getByRole('status').filter({ hasText: 'Browser ini belum mendukung' }).waitFor(); assert.equal(await tool.locator('#qr-value').count(), 0);
 await tool.goto(`${base}/tools/unshorten`); await tool.getByText(/Penelusuran aktif dinonaktifkan/).waitFor(); assert.equal(await tool.getByRole('button', { name: 'Telusuri pengalihan HEAD', exact: true }).isDisabled(), true); await inspect(tool, 'redirect-disabled-mobile');
 activeTrace = true; await tool.reload(); await tool.getByText(/Fitur aktif diizinkan operator/).waitFor(); await tool.locator('#short-url-input').fill('https://example.org'); assert.equal(await tool.getByRole('button', { name: 'Telusuri pengalihan HEAD', exact: true }).isDisabled(), true); await tool.getByLabel(/Saya memahami server/).check(); await tool.getByRole('button', { name: 'Telusuri pengalihan HEAD', exact: true }).click(); await tool.getByRole('heading', { name: 'Jejak belum lengkap', exact: true }).waitFor(); assert.equal(await tool.getByRole('link', { name: 'Tinjau indikator di Periksa' }).count(), 0); await inspect(tool, 'redirect-incomplete-mobile');
 complete = true; await tool.getByRole('button', { name: 'Telusuri pengalihan HEAD', exact: true }).click(); await tool.getByRole('heading', { name: 'Tujuan merespons permintaan HEAD', exact: true }).waitFor(); await tool.getByRole('link', { name: 'Tinjau indikator di Periksa', exact: true }).waitFor(); await tool.locator('#short-url-input').fill('https://other.example.org'); assert.equal(await tool.getByLabel(/Saya memahami server/).isChecked(), false); assert.equal(await tool.getByRole('heading', { name: 'Tujuan merespons permintaan HEAD' }).count(), 0);
 await tool.goto(`${base}/privacy`); await tool.getByText('Penelusur pengalihan aktif', { exact: true }).waitFor(); await inspect(tool, 'privacy-redirect-disclosure-mobile');
 await triage.setViewportSize({ width: 1440, height: 1000 }); await inspect(triage, 'triage-evidence-desktop'); await casePage.setViewportSize({ width: 1440, height: 1000 }); await inspect(casePage, 'cases-desktop'); await tool.setViewportSize({ width: 1440, height: 1000 }); await tool.goto(`${base}/tools/email-header`); await tool.getByRole('button', { name: 'Gunakan contoh' }).click(); await tool.getByRole('button', { name: 'Periksa email', exact: true }).click(); await tool.getByText(/Nilai pass tidak membuktikan/).waitFor(); await inspect(tool, 'email-header-desktop');
 await tool.setViewportSize({ width: 320, height: 740 }); for (const path of ['/analyst', '/analyst/cases', '/tools/message', '/tools/email-header', '/tools/file-hash', '/tools/qr', '/tools/unshorten', '/tools', '/privacy']) { await tool.goto(`${base}${path}`); await tool.waitForTimeout(100); await inspect(tool, `${path}-320`, false); }
 assert.equal(writes.includes('/api/history'), false); assert.deepEqual(errors, []);
 assert.equal((await fetch(`${base}/api/tools/unshorten`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'https://example.org', consent: true }) })).status, 403, 'Actual local endpoint stays off by default; no real target contacted');
 console.log('Batch 3 passed: explicit attachment scopes/dedup, real IndexedDB two-tab conflicts/deleted-case protection, dirty detach, filters, pattern busy/network/malformed/clear/export, local hash/QR and non-IoC privacy, gated consented redirect completion/partial, mobile/desktop/320px axe + overflow. Browser APIs are fixtures; actual local redirect gate verified without outbound network.');
} finally { await browser.close(); }
