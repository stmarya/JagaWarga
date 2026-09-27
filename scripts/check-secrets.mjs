import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*['"][A-Za-z0-9_./+=-]{16,}['"]/i,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
];
const findings = [];
let scanned = 0;
for (const file of files) {
  if (file === 'package-lock.json' || !existsSync(file)) continue;
  const content = readFileSync(file, 'utf8');
  scanned += 1;
  patterns.forEach((pattern) => {
    if (pattern.test(content)) findings.push(`${file}: ${pattern}`);
  });
}
if (findings.length) {
  console.error('Potential secrets detected:\n' + findings.join('\n'));
  process.exit(1);
}
console.log(`Secret pattern check passed for ${scanned} files.`);