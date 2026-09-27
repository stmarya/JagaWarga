import { describe, expect, it } from 'vitest';
import { classifyInput } from './input';

describe('classifyInput', () => {
  it('recognizes a URL', () => expect(classifyInput('https://example.com').type).toBe('url'));
  it('recognizes a domain', () => expect(classifyInput('example.com').type).toBe('domain'));
  it('recognizes an IPv4 address', () => expect(classifyInput('8.8.8.8').type).toBe('ipv4'));
  it('recognizes a SHA-256 hash', () => expect(classifyInput('a'.repeat(64)).type).toBe('hash'));
});
