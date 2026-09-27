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
  await page.goto(baseURL);
  if ((await page.locator('h1').count()) !== 1) throw new Error('Expected one h1');
  if ((await page.locator('label[for="indicator"]').count()) !== 1) throw new Error('Missing input label');
  await page.locator('#indicator').fill('example.com');
  await page.getByRole('button', { name: 'Periksa' }).click();
  await page.getByText('Belum ada cukup data').waitFor();
  console.log('Mobile UI and semantic smoke passed.');
} finally {
  await browser.close();
}