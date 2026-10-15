import assert from 'node:assert/strict';
// Use ONLY a dedicated local single-topology server with all providers disabled.
const base = process.env.BASE_URL ?? 'http://127.0.0.1:3005';
const url = new URL(base);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('This test only runs against a local fixture server.');
const receipts = [];
async function call(method, body, suffix = '') {
  const response = await fetch(`${base}/api/history${suffix}`, { method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
try {
  const health = await fetch(`${base}/api/health`).then((r) => r.json());
  assert.deepEqual(health.providers, [], 'Disable every external provider before this test.');
  assert.equal(health.runtimeTopology, 'single', 'Use a disposable single-topology test server.');
  const policy = await fetch(`${base}/api/policy`).then((r) => r.json());
  assert.equal(policy.features.communityReporting, true, 'Start the dedicated local server with both community flags enabled.');
  assert.equal((await call('POST', { result: { indicator: { displayValue: 'example.org' }, risk: 95 } })).status, 400);
  assert.equal((await call('POST', { indicator: 'example.org' })).status, 400);
  const publication = await call('POST', { indicator: 'example.org', consent: true, result: { risk: 95, verdict: 'high-risk' } });
  assert.equal(publication.status, 201);
  receipts.push({ id: publication.data.item.id, deletionToken: publication.data.deletionToken });
  assert.equal(publication.data.item.result.verdict, 'insufficient-data', 'Disabled providers must produce unknown, not a forged client verdict.');
  assert.equal(publication.data.item.risk, 0);
  assert.equal(Date.parse(publication.data.item.expiresAt) - Date.now() <= 86400000, true);
  const single = await call('GET', undefined, `?id=${publication.data.item.id}`);
  assert.equal(single.status, 200); assert.equal(JSON.stringify(single.data).includes('deletionToken'), false); assert.equal(JSON.stringify(single.data).includes('deletionHash'), false);
  assert.equal((await call('DELETE', { id: publication.data.item.id, deletionToken: '0'.repeat(64) })).status, 404);
  assert.equal((await call('PATCH', { id: publication.data.item.id, message: 'must not be stored' })).status, 403);
  const host = await call('POST', { indicator: 'https://example.org/private/customer?identifier=123#secret', consent: true });
  assert.equal(host.status, 201); receipts.push({ id: host.data.item.id, deletionToken: host.data.deletionToken });
  assert.equal(host.data.item.indicator.displayValue, 'example.org');
  assert.equal(JSON.stringify(host.data.item).includes('customer'), false);
  assert.equal(JSON.stringify(host.data.item).includes('identifier'), false);
  for (const receipt of receipts) {
    assert.equal((await call('DELETE', receipt)).status, 200);
    assert.equal((await call('GET', undefined, `?id=${receipt.id}`)).status, 404);
  }
  receipts.length = 0;
  console.log('Batch 1 live local API passed: consent required, forged results ignored, no-provider unknown, host-only publication, bounded expiry, private capability, unauthorized deletion denied, comments disabled, authorized deletion/read-after-delete. No external providers.');
} finally {
  for (const receipt of receipts) { try { await call('DELETE', receipt); } catch { /* Dedicated local test server is disposable. */ } }
}
