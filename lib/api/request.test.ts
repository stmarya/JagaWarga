import { describe, expect, it } from 'vitest';
import { jsonBody, requestId } from './request';

describe('API request hardening', () => {
  it('accepts a valid request ID', () => {
    expect(requestId(new Request('https://example.test', { headers: { 'x-request-id': 'trace-123' } }))).toBe('trace-123');
  });
  it('rejects a non-JSON body', async () => {
    const request = new Request('https://example.test', { method: 'POST', body: 'x', headers: { 'content-type': 'text/plain' } });
    await expect(jsonBody(request, 100)).rejects.toThrow('CONTENT_TYPE_REQUIRED');
  });
  it('rejects an oversized payload', async () => {
    const request = new Request('https://example.test', { method: 'POST', body: JSON.stringify({ value: 'x'.repeat(100) }), headers: { 'content-type': 'application/json' } });
    await expect(jsonBody(request, 20)).rejects.toThrow('PAYLOAD_TOO_LARGE');
  });
});