import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const executablePath = process.env.CHROMIUM_PATH;
const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  args: ['--no-sandbox'],
});

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const severeErrors = [];
  async function assertAccessible(name) {
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    if (blocking.length) {
      throw new Error(`${name} accessibility violations: ${blocking.map((item) => `${item.id}(${item.nodes.length})`).join(', ')}`);
    }
  }
  page.on('pageerror', (error) => severeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /Failed to convert value to 'Response'|TypeError|ReferenceError/.test(message.text())) {
      severeErrors.push(message.text());
    }
  });
  await page.goto(baseURL);
  if ((await page.locator('h1').count()) !== 1) throw new Error('Expected one h1');
  if ((await page.locator('label[for="indicator"]').count()) !== 1) throw new Error('Missing input label');
  await page.locator('#indicator').fill('example.com');
  await page.getByRole('button', { name: 'ANALISIS →' }).click();
  await page.locator('#lookup-result').waitFor();
  await page.getByText('DATA KURANG').waitFor();
  await page.getByText('Domain aktif. Ini bukan bukti bahwa domain aman.').first().waitFor();
  await assertAccessible('lookup result');
  await page.evaluate(() => navigator.serviceWorker.ready);
  const serviceWorkerCount = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length);
  if (serviceWorkerCount !== 1) throw new Error(`Expected one service worker registration, received ${serviceWorkerCount}`);
  await page.evaluate(async () => {
    await caches.open('jagawarga-obsolete-test');
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  });
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  const obsoleteCacheExists = await page.evaluate(async () => (await caches.keys()).includes('jagawarga-obsolete-test'));
  if (obsoleteCacheExists) throw new Error('Obsolete service-worker cache was not removed after reinstall');

  await context.setOffline(true);
  await page.goto(`${baseURL}/privacy`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Minimalkan data, berikan kontrol.' }).waitFor();
  await context.setOffline(false);

  await page.goto(`${baseURL}/status`);
  await page.getByRole('heading', { name: /Lookup reputasi aktif|Metadata aktif/ }).waitFor();
  await page.getByRole('heading', { name: 'Provider', exact: true }).waitFor();
  await assertAccessible('status');

  await page.goto(`${baseURL}/tools/message`);
  await page.locator('#message').fill('Segera kirim OTP dan password Anda untuk menghindari pemblokiran rekening.');
  await page.getByRole('button', { name: 'Analisis' }).click();
  await page.getByText(/Risk signal:/).waitFor();
  await assertAccessible('message analyzer');

  await page.goto(`${baseURL}/tools/email-header`);
  await page.locator('#headers').fill('Authentication-Results: mx.example; spf=fail dkim=fail dmarc=fail\\nReply-To: attacker@example.net');
  await page.getByRole('button', { name: 'Periksa header' }).click();
  await page.getByText(/Risk signal:/).waitFor();
  await assertAccessible('email header analyzer');

  await page.goto(`${baseURL}/tools/file-hash`);
  await page.locator('#file').setInputFiles({ name: 'safe-test.txt', mimeType: 'text/plain', buffer: Buffer.from('JagaWarga smoke test') });
  await page.locator('textarea[aria-label="SHA-256 hash"]').waitFor();
  const hash = await page.locator('textarea[aria-label="SHA-256 hash"]').inputValue();
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('Invalid local SHA-256 output');
  await assertAccessible('file hash');

  await page.goto(`${baseURL}/tools/qr`);
  await page.locator('#qr').setInputFiles({
    name: 'not-a-qr.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });
  await page.getByText(/Browser ini belum mendukung|QR tidak ditemukan/).waitFor();
  await assertAccessible('QR tool');

  await page.goto(`${baseURL}/dashboard`);
  await page.getByRole('heading', { name: 'CEK. SIMPAN. PANTAU.' }).waitFor();
  await assertAccessible('dashboard');

  await page.goto(`${baseURL}/support`);
  await page.getByRole('heading', { name: 'Dapatkan bantuan tanpa membagikan data sensitif.' }).waitFor();
  if ((await page.getByRole('link', { name: 'Laporkan secara privat' }).count()) !== 1) throw new Error('Missing private security escalation link');
  await assertAccessible('support');

  if (severeErrors.length) throw new Error(`Browser errors: ${severeErrors.join(' | ')}`);
  console.log('Mobile lookup, status, tools, dashboard, and service-worker smoke passed.');
} finally {
  await browser.close();
}