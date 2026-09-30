import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const widths = [320, 360, 375, 390, 414, 768, 820, 1024, 1280, 1440];
const routes = ['/', '/dashboard', '/result', '/details', '/education', '/tools', '/tools/email-header', '/tools/message', '/tools/file-hash', '/tools/qr', '/tools/unshorten', '/emergency'];
const candidates = [
  process.env.CHROMIUM_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/local/bin/chromium',
  '/usr/bin/chromium',
].filter(Boolean);
const executablePath = candidates.find((candidate) => existsSync(candidate));
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
const failures = [];

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const route of routes) {
    const consoleErrors = [];
    const responseErrors = [];
    page.removeAllListeners('console');
    page.removeAllListeners('response');
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) consoleErrors.push(message.text());
    });
    page.on('response', (item) => {
      if (item.status() >= 400 && !item.url().endsWith('/favicon.ico')) responseErrors.push(`${item.status()} ${item.url()}`);
    });
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    const layout = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const overflow = document.documentElement.scrollWidth > viewport + 1;
      const escaped = [...document.querySelectorAll('main *')].filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && (rect.right > viewport + 2 || rect.left < -2);
      }).slice(0, 5).map((node) => `${node.tagName.toLowerCase()}.${node.className}`);
      return { overflow, escaped };
    });
    if (!response?.ok() || layout.overflow || layout.escaped.length || consoleErrors.length || responseErrors.length) {
      failures.push({ width, route, status: response?.status(), ...layout, consoleErrors, responseErrors });
    }
  }
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log(`Responsive QA passed: ${widths.length} widths × ${routes.length} routes.`);