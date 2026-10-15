import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ enabled: false, allowed: true, trace: vi.fn() }));
vi.mock('@/lib/runtime/features', () => ({ featureFlags: () => ({ activeRedirects: mocks.enabled }) }));
vi.mock('@/lib/runtime/rate-limit', () => ({ clientKey: () => 'fixture', rateLimit: async () => ({ allowed: mocks.allowed }) }));
vi.mock('@/lib/security/redirect-trace', async (original) => ({ ...await original<typeof import('@/lib/security/redirect-trace')>(), traceRedirects: mocks.trace }));
import { POST } from './route';
const req = (body: unknown) => new Request('https://local.test/api/tools/unshorten', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(() => { mocks.enabled = false; mocks.allowed = true; mocks.trace.mockReset(); });
describe('active redirect operator/consent boundary', () => {
 it('fails closed before network when disabled', async () => { expect((await POST(req({ url: 'https://example.org', consent: true }))).status).toBe(403); expect(mocks.trace).not.toHaveBeenCalled(); });
 it('requires consent and safe URL before network', async () => { mocks.enabled = true; for (const body of [{ url: 'https://example.org' }, { url: 'http://127.0.0.1', consent: true }]) expect((await POST(req(body))).status).toBe(400); expect(mocks.trace).not.toHaveBeenCalled(); });
 it('enforces rate and input limits', async () => { mocks.enabled = true; mocks.allowed = false; expect((await POST(req({}))).status).toBe(429); mocks.allowed = true; expect((await POST(req({ url: 'x'.repeat(5000), consent: true }))).status).toBe(413); });
 it('returns bounded observations with no-store and generic failures', async () => { mocks.enabled = true; mocks.trace.mockResolvedValue({ completed: false, finalUrl: null, stopReason: 'HTTP_NOT_COMPLETE', hops: [] }); const response = await POST(req({ url: 'https://example.org', consent: true })); expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('no-store'); mocks.trace.mockRejectedValue(new Error('sensitive transport details')); const error = await POST(req({ url: 'https://example.org', consent: true })); expect(error.status).toBe(502); expect(await error.text()).not.toContain('sensitive transport'); });
});
