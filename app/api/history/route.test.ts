import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, PATCH, POST } from './route';
import { performLookup } from '@/lib/lookup';
import { deleteCommunityHistory, saveCommunityHistory } from '@/lib/community-history';
import { rateLimit } from '@/lib/runtime/rate-limit';
vi.mock('@/lib/lookup', () => ({ performLookup: vi.fn() }));
vi.mock('@/lib/community-history', () => ({ COMMUNITY_TTL_SECONDS: 86400, getCommunityHistory: vi.fn().mockResolvedValue([]), saveCommunityHistory: vi.fn().mockResolvedValue({ item: { id: 'fixture' }, deletionToken: 'capability' }), deleteCommunityHistory: vi.fn().mockResolvedValue(true) }));
vi.mock('@/lib/runtime/rate-limit', () => ({ rateLimit: vi.fn().mockResolvedValue({ allowed: true }), clientKey: () => 'fixture' }));
const request = (method: string, body: unknown) => new Request('https://jagawarga.example/api/history', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const result = { indicator: { type: 'domain', displayValue: 'example.org' }, risk: 60, verdict: 'suspicious', confidence: 'medium', checkedAt: '2026-10-14T00:00:00.000Z', scoringVersion: 'severity-independent-v1', conflictingEvidence: false, coverage: { requested: 1, assessed: 1, failed: 0 }, evidence: [] };
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('ALLOW_RISKY_FEATURES', 'true'); vi.stubEnv('FEATURE_COMMUNITY_REPORTING', 'true'); vi.mocked(performLookup).mockResolvedValue(result as never); vi.mocked(rateLimit).mockResolvedValue({ allowed: true } as never); });
afterEach(() => vi.unstubAllEnvs());
describe('community API consent and feature boundary', () => {
  it('rejects legacy automatic publication and does not run lookup without consent', async () => {
    expect((await POST(request('POST', { result }))).status).toBe(400);
    expect(performLookup).not.toHaveBeenCalled(); expect(saveCommunityHistory).not.toHaveBeenCalled();
  });
  it('is disabled by default and hides public listings when gated off', async () => {
    vi.stubEnv('ALLOW_RISKY_FEATURES', 'false');
    expect((await POST(request('POST', { indicator: 'example.org', consent: true }))).status).toBe(403);
    const response = await GET(new Request('https://jagawarga.example/api/history'));
    expect(response.headers.get('X-Community-Enabled')).toBe('false'); expect(await response.json()).toEqual([]);
  });
  it('rechecks the host and ignores forged client scores and URL path/query', async () => {
    const response = await POST(request('POST', { indicator: 'https://example.org/private?customer=123', consent: true, result: { risk: 0 } }));
    expect(response.status).toBe(201); expect(performLookup).toHaveBeenCalledWith('example.org');
    expect(vi.mocked(saveCommunityHistory).mock.calls[0][0].risk).toBe(60);
  });
  it('does not persist when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValue({ allowed: false } as never);
    expect((await POST(request('POST', { indicator: 'example.org', consent: true }))).status).toBe(429);
    expect(saveCommunityHistory).not.toHaveBeenCalled();
  });
  it('rejects oversized or non-JSON bodies', async () => {
    expect((await POST(request('POST', { indicator: 'a'.repeat(5000), consent: true }))).status).toBe(413);
    expect((await POST(new Request('https://example.org/api/history', { method: 'POST', body: '{}' }))).status).toBe(415);
  });
  it('keeps authorized deletion available when sharing is disabled', async () => {
    vi.stubEnv('ALLOW_RISKY_FEATURES', 'false');
    expect((await DELETE(request('DELETE', { id: 'fixture', deletionToken: 'token' }))).status).toBe(200);
    expect(deleteCommunityHistory).toHaveBeenCalledWith('fixture', 'token');
  });
  it('keeps free-text comments deferred', async () => { expect((await PATCH(request('PATCH', { message: 'content' }))).status).toBe(403); });
});
