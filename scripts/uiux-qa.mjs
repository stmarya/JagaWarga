import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.UIUX_QA_ROOT || process.cwd();
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8');
const has = (relativePath, fragment) => read(relativePath).includes(fragment);

function walk(directory) {
  const absolute = join(root, directory);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = join(directory, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative];
  });
}

const appFiles = walk('app').filter((file) => /\.(tsx?|css)$/.test(file));
const hasBrokenScannerAnchor = appFiles.some((file) => read(file).includes('/#scanner'));

const checks = [
  ['canonical UI tokens are loaded last', has('app/layout.tsx', "import './ui-tokens.css';")],
  ['scanner links use the scanner route', !hasBrokenScannerAnchor && has('app/dashboard/page.tsx', '/periksa#scanner')],
  ['result pages restore shared history results', has('app/result/page.tsx', '/api/history?id=')],
  ['result loading and empty states are explicit', has('app/result/page.tsx', 'loadingResult') && has('app/result/page.tsx', 'Hasil belum tersedia')],
  ['scanner tabs expose their panel relationship', has('app/periksa/page.tsx', 'aria-controls="scanner-panel"') && has('app/periksa/page.tsx', 'role="tabpanel"')],
  ['navigation exposes the current page', has('app/site-header.tsx', 'aria-current')],
  ['mobile and reduced-motion guardrails exist', has('app/ui-tokens.css', '@media (max-width: 720px)') && has('app/ui-tokens.css', 'prefers-reduced-motion')],
  ['implementation baseline is documented', existsSync(join(root, 'docs/uiux-implementation-baseline.md'))],
];

const failures = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (failures.length) process.exitCode = 1;
