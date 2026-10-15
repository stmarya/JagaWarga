import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] });
const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const shots = process.env.QA_DIR;
const now = new Date().toISOString();
let serial = 0;
const snapshot = (indicator = 'example.org', state = 'low') => ({
  indicator: { type: indicator.startsWith('https://') ? 'url' : 'domain', displayValue: indicator },
  risk: state === 'unknown' ? 0 : state === 'high' ? 95 : 10,
  verdict: state === 'unknown' ? 'insufficient-data' : state === 'high' ? 'high-risk' : 'no-indication',
  confidence: state === 'unknown' ? 'low' : 'medium', partial: state === 'partial',
  checkedAt: now, requestId: `batch1-fixture-${++serial}`, scoringVersion: 'severity-independent-v1', conflictingEvidence: false,
  coverage: { requested: 1, assessed: state === 'unknown' ? 0 : 1, failed: state === 'partial' ? 1 : 0 },
  evidence: [{ provider: 'fixture-reputation', verdict: state === 'unknown' ? 'unknown' : state === 'high' ? 'malicious' : 'benign', confidence: 0.6,
    observedAt: now, fetchedAt: now, freshness: 'fresh', reasonCodes: [state === 'unknown' ? 'VT_NO_RECORD' : state === 'high' ? 'VT_MULTIPLE_MALICIOUS_DETECTIONS' : 'VT_NO_NEGATIVE_DETECTIONS'], details: { raw: 'DO_NOT_PUBLISH' } }],
});
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await context.newPage(); page.setDefaultTimeout(10_000);
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('dialog', (d) => d.accept());
  let enabled = false; let lookupFail = false; let autoPublications = 0;
  const publicItems = new Map();
  await page.route('**/api/**', async (route) => {
    const request = route.request(); const url = new URL(request.url()); const method = request.method();
    let body = {}; let status = 200; const headers = { 'Content-Type': 'application/json' };
    if (url.pathname === '/api/policy') body = { features: { communityReporting: enabled } };
    else if (url.pathname === '/api/lookups') {
      if (lookupFail) { status = 503; body = { error: 'LOOKUP_FAILED' }; }
      else body = snapshot(request.postDataJSON().indicator);
    } else if (url.pathname === '/api/history') {
      headers['X-Community-Enabled'] = String(enabled);
      if (method === 'POST') {
        autoPublications++;
        const data = request.postDataJSON(); assert.equal(data.consent, true); assert.equal(data.indicator, 'example.org'); assert.equal(data.result, undefined);
        const item = { id: `00000000-0000-4000-8000-${String(serial++).padStart(12, '0')}`, result: snapshot(data.indicator), expiresAt: new Date(Date.now() + 86400000).toISOString() };
        Object.assign(item, { indicator: item.result.indicator, verdict: item.result.verdict, checkedAt: now });
        publicItems.set(item.id, item); body = { item, deletionToken: 'e'.repeat(64) }; status = 201;
      } else if (method === 'DELETE') {
        const data = request.postDataJSON(); assert.equal(data.deletionToken, 'e'.repeat(64));
        publicItems.delete(data.id); body = { deleted: true };
      } else if (url.searchParams.has('id')) { body = publicItems.get(url.searchParams.get('id')); if (!body) { status = 404; body = { error: 'NOT_FOUND' }; } }
      else body = enabled ? [...publicItems.values()] : [];
    } else if (url.pathname === '/api/feedback') body = { accepted: true };
    await route.fulfill({ status, headers, body: JSON.stringify(body) });
  });
  async function inspect(label, capture = false) {
    const violations = (await new AxeBuilder({ page }).analyze()).violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    assert.deepEqual(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], label);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${label} page overflow`);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.ai-assistant-wrapper')).position), 'static', `${label}: assistant must not cover page controls`);
    if (shots && capture) { await mkdir(shots, { recursive: true }); await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.screenshot({ path: `${shots}/${label}.png`, fullPage: true }); }
  }
  async function lookup(value, save = false) {
    await page.goto(`${baseURL}/periksa`);
    await page.getByLabel(/Simpan hasil IoC/).setChecked(save);
    await page.locator('#indicator').fill(value);
    await page.getByRole('button', { name: /Periksa sekarang/ }).click();
    await page.waitForURL('**/result'); await page.getByRole('heading', { name: 'Langkah yang disarankan' }).waitFor();
  }
  await page.goto(`${baseURL}/periksa`);
  assert.equal(await page.getByLabel(/Simpan hasil IoC/).isChecked(), false);
  await page.getByRole('tab', { name: 'Tautan / IoC' }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: 'Teks pesan' }).getAttribute('aria-selected'), 'true');
  await page.keyboard.press('Home');
  assert.equal(await page.getByRole('tab', { name: 'Tautan / IoC' }).getAttribute('aria-selected'), 'true');
  await inspect('periksa-mobile', true);
  await lookup('https://example.org/private?customer=123');
  assert.equal(autoPublications, 0);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('jagawarga:history:v2') ?? '[]').length), 0);
  assert.equal(await page.getByRole('heading', { name: 'Belum ada indikasi ancaman' }).count(), 1);
  assert.equal(await page.getByRole('heading', { name: /Server pengendali|Situs tiruan|Malware pada berkas/ }).count(), 0);
  assert.equal(await page.evaluate(() => {
    const hs = [...document.querySelectorAll('h2')].map((h) => h.textContent);
    return hs.indexOf('Langkah yang disarankan') < hs.indexOf('Bukti yang ditemukan');
  }), true);
  await page.getByText(/Fitur komunitas belum diaktifkan operator/).waitFor();
  await inspect('result-mobile', true);

  await lookup('example.org', true);
  assert.equal(autoPublications, 0);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('jagawarga:history:v2')).length), 1);
  await page.goto(`${baseURL}/dashboard`);
  await page.getByText('example.org', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Riwayat saya (lokal)', exact: true }).getAttribute('aria-pressed'), 'true');
  await inspect('dashboard-mobile', true);
  await page.locator('#history-search').fill('not-found'); await page.getByText('Tidak ada hasil yang cocok.', { exact: true }).waitFor(); await page.locator('#history-search').fill('');
  await page.getByRole('button', { name: 'Buka hasil lokal', exact: true }).click();
  await page.waitForURL('**/result'); await page.getByRole('heading', { name: 'Bukti yang ditemukan' }).waitFor();

  enabled = true; await page.reload();
  const publish = page.getByRole('button', { name: 'Publikasikan setelah persetujuan', exact: true });
  await publish.waitFor(); assert.equal(await publish.isDisabled(), true);
  await page.getByLabel(/Saya telah meninjau preview/).check(); await publish.click();
  await page.getByRole('status').filter({ hasText: 'Dipublikasikan maksimal 24 jam' }).waitFor();
  assert.equal(autoPublications, 1); assert.equal(publicItems.size, 1);
  await page.goto(`${baseURL}/dashboard`); await page.getByRole('button', { name: 'Riwayat komunitas (publik)', exact: true }).click();
  await page.getByRole('link', { name: 'Buka publikasi', exact: true }).waitFor();
  await inspect('dashboard-community-mobile', true);
  await page.getByRole('link', { name: 'Buka publikasi', exact: true }).click();
  await page.getByRole('heading', { name: 'Langkah yang disarankan' }).waitFor();
  await page.getByText(/PUBLIKASI KOMUNITAS/).waitFor();

  // Seed an ordinary local case through its UI, not a server endpoint.
  await page.goto(`${baseURL}/analyst/cases`); await page.getByRole('button', { name: 'Kasus baru', exact: true }).click();
  await page.locator('#case-title').fill('Kasus Batch 1'); await page.getByRole('button', { name: 'Simpan kasus lokal', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Kasus disimpan' }).waitFor();
  await page.evaluate(() => { localStorage.setItem('jagawarga:watchlist:v2', JSON.stringify(['example.org'])); localStorage.setItem('jagawarga:history', '[]'); localStorage.setItem('jagawarga:user-xp', '3'); sessionStorage.setItem('jagawarga:ai-conversation', '[]'); });
  await page.goto(`${baseURL}/privacy`); await page.getByText('1 kasus', { exact: true }).waitFor();
  await inspect('privacy-mobile', true);
  const exported = page.waitForEvent('download'); await page.getByRole('button', { name: 'Ekspor seluruh data lokal', exact: true }).click();
  const archive = JSON.parse(await readFile(await (await exported).path(), 'utf8'));
  assert.equal(archive.local.history.length, 1); assert.equal(archive.local.watchlist.length, 1); assert.equal(archive.cases.length, 1);
  assert.equal(archive.local.legacy.xp, 3); assert.equal(archive.sharedPublications.length, 1); assert.equal(JSON.stringify(archive).includes('deletionToken'), false);
  assert.equal(JSON.stringify(archive).includes('DO_NOT_PUBLISH'), false);
  // Deleting a local row does not remove a public record.
  await page.goto(`${baseURL}/dashboard`); await page.getByRole('button', { name: 'Hapus riwayat ini', exact: true }).click();
  await page.getByText('Belum ada riwayat pribadi.', { exact: true }).waitFor(); assert.equal(publicItems.size, 1);
  await page.goto(`${baseURL}/privacy`); await page.getByRole('button', { name: 'Hapus publikasi server saya', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '1 publikasi dihapus dari server' }).waitFor(); assert.equal(publicItems.size, 0);
  await page.getByRole('button', { name: 'Hapus data lokal dan sesi', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Data persisten di browser ini' }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('jagawarga:user-xp')), null);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('jagawarga:last-result')), null);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('jagawarga:ai-conversation')), null);
  await page.getByText('0 kasus', { exact: true }).waitFor();
  assert.equal(await page.getByLabel(/Simpan hasil IoC berikutnya/).isChecked(), false);

  // Unknown/partial/high-risk states must retain uncertainty and real observations.
  for (const state of ['unknown', 'partial', 'high']) {
    await page.evaluate((r) => sessionStorage.setItem('jagawarga:last-result', JSON.stringify(r)), snapshot('example.org', state));
    await page.goto(`${baseURL}/result`); await page.getByRole('heading', { name: 'Langkah yang disarankan' }).waitFor();
    if (state === 'unknown') { await page.getByRole('heading', { name: 'Belum dapat dinilai', exact: true }).waitFor(); await inspect('result-unknown-mobile', true); }
    if (state === 'partial') await page.getByText(/Hasil parsial:/).waitFor();
    if (state === 'high') await page.getByRole('heading', { name: 'Bahaya tinggi', exact: true }).waitFor();
    await inspect(`result-${state}`);
  }
  await page.goto(`${baseURL}/result?id=missing`); await page.getByRole('heading', { name: 'Hasil tidak ditemukan' }).waitFor();
  await page.evaluate(() => sessionStorage.setItem('jagawarga:last-result', '{invalid'));
  await page.goto(`${baseURL}/result`); await page.getByRole('heading', { name: 'Hasil tidak ditemukan' }).waitFor();
  lookupFail = true; await page.goto(`${baseURL}/periksa`); await page.locator('#indicator').fill('example.org'); await page.getByRole('button', { name: /Periksa sekarang/ }).click();
  await page.getByRole('status').filter({ hasText: 'Pemeriksaan gagal' }).waitFor(); lookupFail = false;
  enabled = false;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate((r) => sessionStorage.setItem('jagawarga:last-result', JSON.stringify(r)), snapshot('example.org'));
  for (const route of ['/periksa', '/result', '/dashboard', '/privacy']) {
    await page.goto(`${baseURL}${route}`); await page.waitForTimeout(150); await inspect(`${route.slice(1)}-desktop`, true);
  }
  await page.setViewportSize({ width: 320, height: 740 });
  for (const route of ['/periksa', '/result', '/dashboard', '/privacy']) { await page.goto(`${baseURL}${route}`); await page.waitForTimeout(100); await inspect(`${route.slice(1)}-320`); }
  assert.deepEqual(errors, [], 'no unhandled browser errors');
  console.log('Batch 1 smoke passed: private default, opt-in history, no automatic publication, evidence-first hierarchy, consent preview, publication/delete, local/public separation, full export, case/local/session clear, unknown/partial/high results, corrupt session, network error, mobile/desktop/320px axe and overflow. Fixture API only.');
} finally { await browser.close(); }
