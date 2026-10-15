import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const shots = process.env.QA_DIR;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--no-sandbox'] });
const now = new Date().toISOString();
const snapshot = { indicator: { type: 'domain', displayValue: 'example.org' }, risk: 10, verdict: 'no-indication', confidence: 'medium', checkedAt: now, requestId: 'batch2-fixture', scoringVersion: 'severity-independent-v1', coverage: { requested: 2, assessed: 1, failed: 0 }, evidence: [
  { provider: 'virustotal', verdict: 'benign', confidence: .6, observedAt: now, fetchedAt: now, freshness: 'fresh', reasonCodes: ['VT_NO_NEGATIVE_DETECTIONS'], details: { attributes: { last_analysis_stats: { harmless: 20, malicious: 0, undetected: 5 }, last_analysis_results: Object.fromEntries(Array.from({ length: 25 }, (_, n) => [n, { engine_name: `Engine ${String(n).padStart(2, '0')}`, category: 'undetected', result: null, engine_update: '20261014' }])), private_context: { fixture: 'PRIVATE_METADATA_NOT_FOR_EXPORT', long_url: `https://example.org/${'segment/'.repeat(80)}` } } } },
  { provider: 'fixture-dns', verdict: 'unknown', confidence: .4, observedAt: null, fetchedAt: now, freshness: 'unknown', reasonCodes: ['DNS_RESOLVES'] },
] };
try {
 const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
 const page = await context.newPage(); page.setDefaultTimeout(10000);
 const errors = []; const mutations = [];
 page.on('pageerror', (e) => errors.push(`${new URL(page.url()).pathname}: ${e.message}`));
 await page.route('**/api/**', async (route) => {
  const r = route.request(); const url = new URL(r.url()); if (r.method() !== 'GET') mutations.push(url.pathname);
  if (url.pathname === '/api/history') {
   if (url.searchParams.get('id') === 'network') { await route.abort(); return; }
   if (url.searchParams.get('id') === 'fixture-public') {
    const { details, ...e } = snapshot.evidence[0];
    await route.fulfill({ json: { id: 'fixture-public', result: { ...snapshot, evidence: [e, snapshot.evidence[1]] } } }); return;
   }
   await route.fulfill({ status: 404, json: { error: 'NOT_FOUND' } }); return;
  }
  if (url.pathname === '/api/education') { await route.fulfill({ json: [{ slug: 'phishing', title: 'Kenali phishing', description: 'Materi fixture untuk pemeriksaan navigasi.', badge: 'Dasar', level: 'beginner', lessonCount: 1, questionCount: 1 }] }); return; }
  if (url.pathname === '/api/policy') { await route.fulfill({ json: { features: { communityReporting: false }, providers: [] } }); return; }
  await route.fulfill({ json: {} });
 });
 async function inspect(label, capture = true) {
  const violations = (await new AxeBuilder({ page }).analyze()).violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  assert.deepEqual(violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], label);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${label}: page overflow`);
  assert.equal(await page.locator('h1').count(), 1, `${label}: one h1`);
  assert.equal(await page.locator('.ai-assistant-wrapper').evaluate((el) => getComputedStyle(el).position), 'static', `${label}: assistant inline`);
  if (capture && shots) { await mkdir(shots, { recursive: true }); await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.screenshot({ path: `${shots}/${label}.png`, fullPage: true }); }
 }
 async function seed(value = snapshot) { await page.evaluate((v) => sessionStorage.setItem('jagawarga:last-result', JSON.stringify(v)), value); }
 async function details(value = snapshot) { await seed(value); await page.goto(`${base}/details`); await page.getByRole('heading', { name: 'Baca bukti, pahami batasnya.' }).waitFor(); }
 await page.goto(`${base}/emergency`);
 await page.getByRole('heading', { name: 'Pilih kondisi Anda' }).waitFor();
 assert.equal(await page.locator('.site-nav [aria-current=page]').textContent(), '!Darurat');
 assert.equal(await page.locator('.emergency-v2-choices [aria-pressed=true]').count(), 0);
 await inspect('emergency-mobile');
 await page.getByRole('button', { name: 'Buka langkah transaksi' }).click();
 assert.equal(await page.locator('#emergency-plan-title').evaluate((el) => el === document.activeElement), true);
 await page.getByText(/Laporan IASC tidak menggantikan Laporan Polisi/).waitFor();
 assert.equal(await page.locator('#emergency-plan a[href="https://iasc.ojk.go.id/"]').getAttribute('target'), '_blank');
 await page.getByRole('checkbox').first().check(); await page.getByRole('status').filter({ hasText: '1 dari' }).waitFor();
 await inspect('emergency-money-mobile');
 for (const title of ['Terlanjur membuka tautan', 'Memberikan password atau OTP', 'Memasang APK atau aplikasi', 'Akun sudah diambil alih']) {
  await page.getByRole('button', { name: new RegExp(`^${title}`) }).click();
  await page.getByRole('heading', { name: title, exact: true }).waitFor();
  assert.equal(await page.locator('input[type=checkbox]:checked').count(), 0);
  assert.equal(await page.locator('#emergency-plan a[href="https://iasc.ojk.go.id/"]').count(), 0, 'No unconditional transaction CTA for unrelated incidents');
  await inspect(`emergency-${title.split(' ')[0]}`, false);
 }
 await page.getByRole('button', { name: /^Memasang APK/ }).click(); await inspect('emergency-app-mobile');
 await page.reload(); await page.getByRole('heading', { name: 'Pilih kondisi Anda' }).waitFor();
 assert.equal(await page.evaluate(() => localStorage.length), 0, 'Emergency choices never persisted');
 await details();
 await page.getByRole('heading', { name: 'Bukti per sumber (2)' }).waitFor();
 await page.getByText('DNS aktif tidak membuktikan domain aman.').waitFor();
 assert.equal(await page.locator('[aria-current=step]').textContent(), '3Bukti teknis');
 assert.equal(await page.locator('.site-nav [aria-current=page]').textContent(), 'Mulai Cek');
 await inspect('details-mobile');
 await page.getByRole('button', { name: 'Halaman berikutnya', exact: true }).click();
 await page.getByRole('status').filter({ hasText: 'halaman 2 dari 2' }).waitFor();
 assert.equal(await page.locator('tbody tr').count(), 5);
 await page.locator('#engine-filter').fill('Engine 07'); assert.equal(await page.locator('tbody tr').count(), 1);
 await page.locator('#engine-filter').fill('NO_MATCH'); await page.getByText('Tidak ada mesin yang cocok dengan pencarian.').waitFor();
 await page.locator('#engine-filter').fill('');
 const d = page.waitForEvent('download'); await page.getByRole('button', { name: 'Ekspor evidence JSON', exact: true }).click();
 const exported = JSON.parse(await readFile(await (await d).path(), 'utf8'));
 assert.equal(exported.evidence.length, 2); assert.equal(JSON.stringify(exported).includes('PRIVATE_METADATA'), false); assert.equal(exported.evidence[0].details, undefined);
 await page.getByText('Metadata mentah virustotal (tinjau sebelum berbagi)', { exact: true }).click();
 await page.locator('summary').filter({ hasText: /^private_context$/ }).click();
 await inspect('details-metadata-mobile');
 await page.emulateMedia({ media: 'print' });
 assert.equal(await page.locator('.technical-metadata').isVisible(), false);
 assert.equal(await page.locator('.footer-shell').isVisible(), false);
 assert.equal(await page.getByText('JagaWarga — ringkasan bukti teknis', { exact: true }).isVisible(), true);
 if (shots) await page.screenshot({ path: `${shots}/details-print.png`, fullPage: true });
 await page.emulateMedia({ media: 'screen' });
 await page.goto(`${base}/details?id=fixture-public`); await page.getByRole('heading', { name: 'Baca bukti, pahami batasnya.' }).waitFor();
 assert.equal(await page.getByRole('link', { name: 'Kembali ke hasil', exact: true }).getAttribute('href'), '/result?id=fixture-public');
 assert.equal(await page.getByRole('link', { name: 'Buka Mode Analis', exact: true }).count(), 0);
 await page.getByText('Statistik mesin tidak tersedia. Snapshot normalisasi tidak membawa metadata mentah.').waitFor();
 await inspect('details-public-mobile');
 for (const id of ['missing', 'network']) { await page.goto(`${base}/details?id=${id}`); await page.getByRole('heading', { name: 'Detail tidak tersedia' }).waitFor(); assert.equal(await page.getByRole('heading', { name: 'Bukti per sumber (2)' }).count(), 0); }
 await page.evaluate(() => sessionStorage.setItem('jagawarga:last-result', '{corrupt')); await page.goto(`${base}/details`); await page.getByRole('heading', { name: 'Detail tidak tersedia' }).waitFor(); await inspect('details-error-mobile');
 await details({ ...snapshot, coverage: { requested: 2, assessed: 0, failed: 1 }, confidence: 'low', verdict: 'insufficient-data', risk: 0, conflictingEvidence: true, evidence: [{ ...snapshot.evidence[1], freshness: 'stale' }] });
 await page.getByRole('heading', { name: 'Belum dapat dinilai', exact: true }).waitFor(); await page.getByText(/Hasil parsial:/).waitFor(); await page.getByText(/Ada evidence lama/).waitFor(); await page.getByText(/Sumber memberi sinyal yang bertentangan/).waitFor(); await inspect('details-unknown-mobile');
 await details({ ...snapshot, indicator: { type: 'url', displayValue: 'https://example.org/?token=fixture-sensitive' } }); assert.equal(await page.getByRole('button', { name: 'Ekspor evidence JSON', exact: true }).isDisabled(), true);
 // Keyboard-only skip link, assistant modal escape/focus return, shared navigation.
 await page.goto(`${base}/emergency`); await page.keyboard.press('Tab');
 assert.equal(await page.getByRole('link', { name: 'Lewati ke konten utama' }).evaluate((el) => el === document.activeElement), true);
 await page.keyboard.press('Enter'); assert.equal(await page.locator('#main-content').evaluate((el) => el === document.activeElement), true);
 await page.getByRole('button', { name: 'Buka pendamping keamanan digital' }).click(); await page.getByRole('dialog').waitFor();
 const modalViolations = (await new AxeBuilder({ page }).analyze()).violations.filter((v) => ['serious', 'critical'].includes(v.impact)); assert.deepEqual(modalViolations.map((v) => v.id), []);
 if (shots) await page.screenshot({ path: `${shots}/assistant-mobile.png`, fullPage: false });
 await page.keyboard.press('Escape'); await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Buka pendamping keamanan digital'); assert.equal(await page.getByRole('button', { name: 'Buka pendamping keamanan digital' }).evaluate((el) => el === document.activeElement), true);
 await page.setViewportSize({ width: 1440, height: 1000 });
 await page.goto(`${base}/emergency`); await page.getByRole('button', { name: 'Buka langkah transaksi' }).click(); await inspect('emergency-desktop');
 await details(); await inspect('details-desktop');
 for (const width of [320, 768]) {
  await page.setViewportSize({ width, height: 900 });
  for (const route of ['/emergency', '/details', '/periksa', '/dashboard', '/education', '/tools', '/analyst']) {
   await page.goto(`${base}${route}`); await page.waitForTimeout(100);
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${route} ${width} overflow`);
   for (const link of await page.locator('.site-nav a').all()) { const box = await link.boundingBox(); assert.equal(box.height >= 44, true, `${route} nav target`); }
   if (['/emergency', '/details'].includes(route)) await inspect(`${route.slice(1)}-${width}`, false);
  }
 }
 assert.deepEqual(mutations, [], 'No automatic writes from emergency/details');
 assert.deepEqual(errors, [], 'No unhandled browser errors');
 console.log('Batch 2 smoke passed: five emergency branches/checklist reset/focus, guarded local/public details, metadata and engine filter/pagination, normalized export, private print, stale/partial/conflicting/unknown, invalid/network states, skip link, modal escape, shared nav 44px, mobile/desktop/320/768px axe and overflow. Fixture API only.');
} finally { await browser.close(); }
