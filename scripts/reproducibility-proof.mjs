import { execFileSync, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const root = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'jagawarga-repro-'));
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);
for (const file of files) {
  try {
    if (!(await stat(resolve(root, file))).isFile()) continue;
  } catch { continue; }
  const target = join(temp, file);
  await mkdir(dirname(target), { recursive: true });
  await cp(resolve(root, file), target);
}
function run(command, args) {
  const result = spawnSync(command, args, { cwd: temp, encoding: 'utf8', env: { ...process.env, CI: 'true' } });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
}
try {
  run('npm', ['ci']);
  run('npm', ['test']);
  run('npm', ['run', 'test:openapi']);
  run('npm', ['run', 'build']);
  const pkg = JSON.parse(await readFile(join(temp, 'package.json'), 'utf8'));
  const report = { decision: 'PASSED', generatedAt: new Date().toISOString(), version: pkg.version, sourceFiles: files.length, commands: ['npm ci', 'npm test', 'npm run test:openapi', 'npm run build'] };
  await writeFile(resolve(root, 'artifacts/reproducibility-proof-latest.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await rm(temp, { recursive: true, force: true });
}
