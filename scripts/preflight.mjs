const baseURL = (process.env.BASE_URL ?? '').replace(/\/$/, '');
const token = process.env.ADMIN_METRICS_TOKEN;
const expectedImageDigest = process.env.EXPECTED_IMAGE_DIGEST;
if (!baseURL) throw new Error('BASE_URL is required');
if (!baseURL.startsWith('https://') && process.env.ALLOW_HTTP_PREFLIGHT !== 'true') {
  throw new Error('HTTPS is required unless ALLOW_HTTP_PREFLIGHT=true');
}

async function json(path, options = {}) {
  const response = await fetch(baseURL + path, options);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

const homepage = await fetch(baseURL + '/');
if (!homepage.ok) throw new Error(`Homepage failed: ${homepage.status}`);
for (const header of ['content-security-policy', 'x-content-type-options', 'x-frame-options', 'permissions-policy', 'referrer-policy']) {
  if (!homepage.headers.get(header)) throw new Error(`Missing security header: ${header}`);
}
if (baseURL.startsWith('https://')) {
  const hsts = homepage.headers.get('strict-transport-security') ?? '';
  if (!/max-age=(?:[3-9]\d{7,}|\d{9,})/.test(hsts)) {
    throw new Error('Missing or insufficient Strict-Transport-Security max-age');
  }
}

const live = await json('/api/live');
if (!live.response.ok || live.body.status !== 'alive') throw new Error('Liveness failed');
const ready = await json('/api/ready');
if (!ready.response.ok || ready.body.status !== 'ready') throw new Error('Readiness failed');
if (ready.body.warnings?.length) {
  throw new Error(`Provider configuration warnings: ${ready.body.warnings.map((item) => `${item.name}:${item.reason}`).join(', ')}`);
}
if (process.env.REQUIRE_REPUTATION_PROVIDER === 'true') {
  const reputationReady = ready.body.providerDiagnostics?.some((provider) => provider.kind === 'reputation' && provider.status === 'enabled');
  if (!reputationReady) throw new Error('Reputation provider is required but not enabled');
}
const policy = await json('/api/policy');
for (const flag of ['fileUpload', 'urlSubmission', 'communityReporting']) {
  if (policy.body.features?.[flag]) throw new Error(`Risky feature enabled: ${flag}`);
}
const version = await json('/api/version');
if (!version.response.ok || !version.body.version) throw new Error('Version failed');
if (expectedImageDigest && version.body.imageDigest !== expectedImageDigest) {
  throw new Error(`Image digest mismatch: expected ${expectedImageDigest}, received ${version.body.imageDigest ?? 'missing'}`);
}
const unauthorizedMetrics = await json('/api/metrics');
if (process.env.NODE_ENV === 'production' && unauthorizedMetrics.response.status !== 401) {
  throw new Error('Metrics endpoint is not protected');
}
if (token) {
  const metrics = await json('/api/metrics', { headers: { authorization: `Bearer ${token}` } });
  if (!metrics.response.ok) throw new Error('Authorized metrics failed');
}
console.log(JSON.stringify({ status: 'passed', baseURL, version: version.body.version, providers: ready.body.providers }, null, 2));