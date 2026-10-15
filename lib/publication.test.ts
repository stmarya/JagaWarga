import { describe, expect, it } from 'vitest';
import { publicationIndicator } from './publication';
describe('public indicator preview', () => {
  it('publishes a host, never URL paths, queries, or fragments', () => {
    expect(publicationIndicator('https://example.org/private/customer?a=123#secret')).toBe('example.org');
  });
  it('rejects recognized secrets and nonpublic IPs', () => {
    expect(() => publicationIndicator('https://example.org/?token=secret')).toThrow();
    expect(() => publicationIndicator('http://127.0.0.1/private')).toThrow();
  });
  it('retains valid hash and public IP inputs', () => {
    expect(publicationIndicator('a'.repeat(64))).toBe('a'.repeat(64));
    expect(publicationIndicator('8.8.8.8')).toBe('8.8.8.8');
  });
});