import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] });
const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const now = new Date().toISOString();
const result = (indicator, n) => ({
  indicator: { type: 'domain', displayValue: indicator }, risk: 60, verdict: 'suspicious', confidence: 'medium',
  checkedAt: now, requestId: `fixture-${n}`, scoringVersion: 'severity-independent-v1',
  coverage: { requested: 2, assessed: 1, failed: 0 }, conflictingEvidence: false,
  evidence: [{ provider: 'fixture-reputation', verdict: 'suspicious', confidence: 0.6, observedAt: now, fetchedAt: now,
    reasonCodes: ['FIXTURE_SUSPICIOUS'], freshness: 'fresh', submissionOccurred: false,
    details: { secret: 'DO_NOT_EXPORT' } },
  { provider: 'fixture-dns', verdict: 'unknown', confidence: 0.4, observedAt: null, fetchedAt: now,
    reasonCodes: ['DNS_RESOLVES'], freshness: 'fresh', submissionOccurred: false }],
});
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  let calls = 0; let mode = 'success'; let slowSeen = false;
  await page.route('**/api/lookups', async (route) => {
    calls += 1;
    const { indicator } = route.request().postDataJSON();
    if (mode === 'slow') { slowSeen = true; await new Promise((resolve) => setTimeout(resolve, 600)); }
    const code = mode === 'quota' ? 429 : indicator === 'failed.example.org' ? 500 : 200;
    try { await route.fulfill({ status: code, contentType: 'application/json', headers: { 'Retry-After': '1' }, body: JSON.stringify(code === 200 ? result(indicator, calls) : { error: 'FIXTURE_ERROR' }) }); }
    catch { /* Browser request may have been cancelled deliberately. */ }
  });
  async function preview(text) {
    if (!(await page.locator('#batch-input').isVisible())) await page.getByText('1. Masukkan atau impor indikator', { exact: true }).click();
    await page.locator('#batch-input').fill(text);
    await page.getByRole('button', { name: 'Preview lokal', exact: true }).click();
  }
  async function approve() { await page.getByLabel(/Saya menyetujui/).check(); }
  async function accessible(label) {
    const violations = (await new AxeBuilder({ page }).analyze()).violations.filter((v) => ['critical', 'serious'].includes(v.impact));
    assert.deepEqual(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(', ') + ' ' + n.failureSummary).join('; ')}`), [], `${label}: serious/critical accessibility`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${label}: horizontal page overflow`);
  }
  await page.goto(`${baseURL}/analyst`);
  await preview('EXAMPLE.ORG\nexample.org\nfailed.example.org\nsecond.example.org\nhttps://user:secret@example.org');
  assert.equal(calls, 0, 'preview must stay local');
  assert.equal(await page.getByRole('button', { name: 'Mulai / lanjutkan lookup' }).isDisabled(), true);
  assert.equal(await page.locator('tbody tr').count(), 4, 'dedup plus invalid row');
  assert.equal(await page.locator('#batch-input').inputValue(), '');
  await approve();
  await page.getByRole('button', { name: 'Mulai / lanjutkan lookup' }).click();
  await page.getByRole('status').filter({ hasText: 'Batch selesai' }).waitFor();
  assert.equal(calls, 3, 'valid unique IoCs only, failure does not stop batch');
  assert.equal(await page.locator('tbody tr').filter({ hasText: 'done' }).count(), 2);
  await page.getByRole('button', { name: 'Lihat bukti 1', exact: true }).click();
  await page.getByRole('heading', { name: 'Bukti pemeriksaan' }).waitFor();
  await accessible('mobile analyst');
  if (process.env.QA_DIR) { await mkdir(process.env.QA_DIR, { recursive: true }); await page.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelectorAll('.analyst-scroll').forEach((el) => { el.scrollLeft = 0; }); }); await page.screenshot({ path: `${process.env.QA_DIR}/analyst-mobile.png`, fullPage: true }); }

  await page.locator('#triage-filter').selectOption('suspicious');
  assert.equal(await page.locator('.triage-desktop tbody tr').count(), 2);
  await page.locator('#triage-filter').selectOption('all');
  const evidenceDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ekspor evidence JSON', exact: true }).click();
  const evidence = JSON.parse(await readFile(await (await evidenceDownload).path(), 'utf8'));
  assert.equal(JSON.stringify(evidence).includes('DO_NOT_EXPORT'), false);
  await preview('quota.example.org'); mode = 'quota'; await approve();
  await page.getByRole('button', { name: 'Mulai / lanjutkan lookup' }).click();
  await page.getByRole('status').filter({ hasText: 'Batas lookup tercapai' }).waitFor();
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((b) => b.textContent === 'Mulai / lanjutkan lookup')?.disabled);
  mode = 'success'; await page.getByRole('button', { name: 'Mulai / lanjutkan lookup' }).click();
  await page.getByRole('status').filter({ hasText: 'Batch selesai' }).waitFor();

  mode = 'slow'; slowSeen = false; await preview('cancel.example.org\npending.example.org'); await approve();
  await page.getByRole('button', { name: 'Mulai / lanjutkan lookup' }).click();
  await page.waitForTimeout(100); assert.equal(slowSeen, true);
  await page.getByRole('button', { name: 'Batalkan', exact: true }).click();
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((b) => b.textContent === 'Mulai / lanjutkan lookup')?.disabled);
  assert.equal(await page.locator('tbody tr').filter({ hasText: 'ready' }).count(), 2);
  // Pause finishes the current request without starting the next one.
  const beforePause = calls; slowSeen = false;
  await page.getByRole('button', { name: 'Mulai / lanjutkan lookup' }).click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: 'Jeda', exact: true }).click();
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].find((b) => b.textContent === 'Mulai / lanjutkan lookup')?.disabled);
  assert.equal(calls, beforePause + 1);
  assert.equal(await page.locator('tbody tr').filter({ hasText: 'ready' }).count(), 1);
  mode = 'success'; await page.getByRole('button', { name: 'Mulai / lanjutkan lookup' }).click();
  await page.getByRole('status').filter({ hasText: 'Batch selesai' }).waitFor();

  await page.goto(`${baseURL}/analyst/cases`);
  await page.getByRole('button', { name: 'Kasus baru', exact: true }).click();
  await page.locator('#case-title').fill('Investigasi fixture');
  await page.locator('#case-notes').fill('<script>alert(1)</script> Hipotesis, bukan fakta');
  await page.getByRole('button', { name: 'Simpan kasus lokal', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Kasus disimpan' }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Investigasi fixture', exact: true }).click();
  assert.equal(await page.locator('#case-notes').inputValue(), '<script>alert(1)</script> Hipotesis, bukan fakta');
  await accessible('mobile cases');

  await page.goto(`${baseURL}/analyst`);
  await preview('example.org'); await approve();
  await page.getByRole('button', { name: 'Mulai / lanjutkan lookup' }).click();
  await page.getByRole('status').filter({ hasText: 'Batch selesai' }).waitFor();
  await page.locator('#attach-scope').selectOption('batch');
  await page.locator('#case-select').selectOption({ label: 'Investigasi fixture' });
  await page.getByRole('button', { name: 'Simpan evidence ke kasus', exact: true }).click();
  await page.getByRole('status').filter({ hasText: /evidence tersimpan/i }).waitFor();
  await page.goto(`${baseURL}/analyst/cases`);
  await page.getByRole('button', { name: 'Investigasi fixture', exact: true }).click();
  await page.getByRole('button', { name: 'Lihat snapshot 1', exact: true }).click();
  const caseDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ekspor paket kasus', exact: true }).click();
  const packet = await readFile(await (await caseDownload).path(), 'utf8');
  assert.equal(JSON.parse(packet).case.snapshots.length, 1);
  assert.equal(packet.includes('DO_NOT_EXPORT'), false);
  await page.locator('#case-import').setInputFiles({ name: 'case.json', mimeType: 'application/json', buffer: Buffer.from(packet) });
  await page.getByRole('status').filter({ hasText: 'Paket diimpor' }).waitFor();
  await page.getByRole('button', { name: 'Investigasi fixture', exact: true }).nth(1).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Investigasi fixture', exact: true }).count(), 2, 'import must not overwrite');
  await page.getByText('Muat ulang atau hapus kasus', { exact: true }).click();
  await page.getByRole('button', { name: 'Hapus kasus ini', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Kasus lokal dihapus' }).waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('button')].filter((b) => b.textContent === 'Investigasi fixture').length === 1);
  assert.equal(await page.getByRole('button', { name: 'Investigasi fixture', exact: true }).count(), 1);
  await page.goto(`${baseURL}/privacy`);
  await page.getByRole('button', { name: 'Hapus data lokal dan sesi', exact: true }).click();
  await page.getByText(/Data persisten di browser ini/).waitFor();
  await page.goto(`${baseURL}/analyst/cases`);
  await page.getByText('Belum ada kasus tersimpan.').waitFor();

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/analyst`);
  await preview('example.org'); await approve();
  await page.getByRole('button', { name: 'Mulai / lanjutkan lookup' }).click();
  await page.getByRole('status').filter({ hasText: 'Batch selesai' }).waitFor();
  await page.getByRole('button', { name: 'Lihat bukti 1', exact: true }).click();
  await accessible('desktop analyst');
  if (process.env.QA_DIR) { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.screenshot({ path: `${process.env.QA_DIR}/analyst-desktop.png`, fullPage: true }); }
  await page.setViewportSize({ width: 320, height: 740 });
  await accessible('narrow mobile analyst');
  assert.deepEqual(errors, [], 'no page errors');
  console.log('Analyst smoke passed: consent, dedup, errors, filter, evidence export, 429 pause, cancel/resume, pause, IndexedDB reload, snapshot attach, import/export/delete, privacy clear, mobile/desktop axe + overflow. Fixture API only.');
} finally { await browser.close(); }
