import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const port = Number(process.env.ACCEPTANCE_PORT || 3100);
const baseURL = `http://127.0.0.1:${port}`;
const startedAt = new Date().toISOString();
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port), '-H', '127.0.0.1'], {
  env: { ...process.env, NODE_ENV: 'production', APP_VERSION: '0.12.1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
child.stdout.on('data', (chunk) => { serverOutput += chunk; });
child.stderr.on('data', (chunk) => { serverOutput += chunk; });

async function waitUntilReady() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Server exited early (${child.exitCode}): ${serverOutput}`);
    try {
      const response = await fetch(`${baseURL}/api/live`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Server did not become ready: ${serverOutput}`);
}

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

async function loadSmoke(total = 500, concurrency = 25) {
  let next = 0;
  let passed = 0;
  const durations = [];
  async function worker() {
    while (next < total) {
      next += 1;
      const start = performance.now();
      const response = await fetch(`${baseURL}/api/live`);
      durations.push(performance.now() - start);
      if (response.ok) passed += 1;
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  durations.sort((a, b) => a - b);
  return {
    total,
    passed,
    concurrency,
    p95Ms: Math.round(durations[Math.floor(durations.length * 0.95)]),
    maxMs: Math.round(durations.at(-1)),
  };
}

try {
  await waitUntilReady();
  const preflight = run(process.execPath, ['scripts/preflight.mjs'], {
    BASE_URL: baseURL,
    ALLOW_HTTP_PREFLIGHT: 'true',
    NODE_ENV: 'production',
  });
  const discoveredChromium = spawnSync('sh', ['-lc', 'command -v chromium || command -v chromium-browser'], {
    encoding: 'utf8',
  }).stdout.trim();
  const chromiumPath = process.env.CHROMIUM_PATH || discoveredChromium;
  if (!chromiumPath) throw new Error('Chromium executable not found');
  const uiSmoke = run(process.execPath, ['scripts/ui-smoke.mjs'], {
    BASE_URL: baseURL,
    CHROMIUM_PATH: chromiumPath,
  });
  const load = await loadSmoke();
  if (load.passed !== load.total) throw new Error(`Load smoke failed: ${load.passed}/${load.total}`);

  const report = {
    decision: 'LOCAL-READY',
    publicProductionDecision: 'NO-GO',
    version: '0.12.1',
    runtime: 'native-nextjs-production',
    bind: `127.0.0.1:${port}`,
    startedAt,
    completedAt: new Date().toISOString(),
    checks: {
      build: 'passed-before-run',
      preflight: JSON.parse(preflight),
      uiSmoke,
      load,
    },
    limitations: [
      'Docker runtime was not available on the acceptance runner.',
      'Public external evidence gates remain mandatory.',
      'This report is not a public production approval.',
    ],
  };
  await mkdir(resolve('artifacts'), { recursive: true });
  await writeFile(resolve('artifacts/local-acceptance-latest.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  child.kill('SIGTERM');
  await new Promise((resolveWait) => {
    if (child.exitCode !== null) return resolveWait();
    child.once('exit', resolveWait);
    setTimeout(() => {
      child.kill('SIGKILL');
      resolveWait();
    }, 5_000).unref();
  });
}