import { describe, expect, it } from 'vitest';
import { MAX_BATCH, normalizeIndicator, parseBatch } from './indicators';

describe('analyst input preview', () => {
  it('normalizes defanged indicators, labeled hashes and removes duplicates', () => {
    expect(parseBatch(`hxxps://example[.]org/path\nhttps://example.org/path\nSHA256: ${'a'.repeat(64)}\nEXAMPLE.ORG`))
      .toEqual([
        { type: 'url', value: 'https://example.org/path' },
        { type: 'hash', value: 'a'.repeat(64) },
        { type: 'domain', value: 'example.org' },
      ]);
  });
  it('supports a BOM, CRLF and quoted one-column CSV', () => {
    expect(parseBatch('\uFEFFindicator\r\n"example.org"\r\n"https://example.org/?a=1,2"', true)).toHaveLength(2);
  });
  it('rejects multi-column CSV and unsupported values without retaining raw input', () => {
    const rows = parseBatch('example.org,secret\nhttps://a:password@example.org', true);
    expect(rows.every((row) => row.error)).toBe(true);
    expect(JSON.stringify(rows)).not.toContain('password');
  });
  it.each(['127.0.0.1', '10.0.0.1', '::1', 'https://127.0.0.1', 'https://example.org/?token=secret', 'https://user:secret@example.org', 'not-an-ioc'])('blocks unsafe input %s', (raw) => {
    expect(() => normalizeIndicator(raw)).toThrow();
  });
  it('removes URL fragments before lookup', () => {
    expect(normalizeIndicator('https://example.org/#secret').value).toBe('https://example.org/');
  });
  it('rejects oversized payloads and batches, rather than silently dropping rows', () => {
    expect(() => parseBatch('a'.repeat(65537))).toThrow('64 KB');
    expect(() => parseBatch(Array.from({ length: MAX_BATCH + 1 }, () => 'example.org').join('\n'))).toThrow('20');
  });
});