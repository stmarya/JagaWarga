import { chromium } from 'playwright';

const executablePath = process.env.CHROMIUM_PATH;
const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  args: ['--no-sandbox'],
});

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const severeErrors = [];
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
  await page.getByRole('button', { name: 'Periksa' }).click();
  await page.getByText('Belum ada cukup data reputasi').waitFor();
  await page.getByText('Sumber pemeriksaan').click();
  await page.getByText('Domain aktif dan memiliki jawaban DNS; ini bukan bukti bahwa domain aman.').first().waitFor();

  await page.goto(`${baseURL}/status`);
  await page.getByRole('heading', { name: /Lookup reputasi aktif|Metadata aktif/ }).waitFor();
  await page.getByRole('heading', { name: 'Provider', exact: true }).waitFor();

  await page.goto(`${baseURL}/tools/message`);
  await page.locator('#message').fill('Segera kirim OTP dan password Anda untuk menghindari pemblokiran rekening.');
  await page.getByRole('button', { name: 'Analisis' }).click();
  await page.getByText(/Risk signal:/).waitFor();

  await page.goto(`${baseURL}/tools/email-header`);
  await page.locator('#headers').fill('Authentication-Results: mx.example; spf=fail dkim=fail dmarc=fail\\nReply-To: attacker@example.net');
  await page.getByRole('button', { name: 'Periksa header' }).click();
  await page.getByText(/Risk signal:/).waitFor();

  await page.goto(`${baseURL}/tools/file-hash`);
  await page.locator('#file').setInputFiles({ name: 'safe-test.txt', mimeType: 'text/plain', buffer: Buffer.from('JagaWarga smoke test') });
  await page.locator('textarea[aria-label="SHA-256 hash"]').waitFor();
  const hash = await page.locator('textarea[aria-label="SHA-256 hash"]').inputValue();
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('Invalid local SHA-256 output');

  await page.goto(`${baseURL}/dashboard`);
  await page.getByRole('heading', { name: 'Progress dan data Anda.' }).waitFor();

  if (severeErrors.length) throw new Error(`Browser errors: ${severeErrors.join(' | ')}`);
  console.log('Mobile lookup, status, tools, dashboard, and service-worker smoke passed.');
} finally {
  await browser.close();
}