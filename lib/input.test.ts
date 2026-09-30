import { describe, expect, it } from 'vitest';
import { classifyInput, classifySmartInput } from './input';

describe('classifyInput', () => {
  it('recognizes a URL', () => expect(classifyInput('https://example.com').type).toBe('url'));
  it('recognizes a domain', () => expect(classifyInput('example.com').type).toBe('domain'));
  it('recognizes an IPv4 address', () => expect(classifyInput('8.8.8.8').type).toBe('ipv4'));
  it('recognizes a SHA-256 hash', () => expect(classifyInput('a'.repeat(64)).type).toBe('hash'));
  it('recognizes labeled SHA-256 hash', () => {
    const res = classifyInput('SHA256: fcf5dbce80dd904652d4746dd6b26e34763cb07090573967ff6aa6c084496c16');
    expect(res.type).toBe('hash');
    expect(res.normalized).toBe('fcf5dbce80dd904652d4746dd6b26e34763cb07090573967ff6aa6c084496c16');
  });
  it('recognizes defanged domains and urls', () => {
    expect(classifyInput('malware[.]com').type).toBe('domain');
    expect(classifyInput('hxxps://phishing[.]org/login').type).toBe('url');
    expect(classifyInput('103[.]20[.]188[.]1').type).toBe('ipv4');
  });
});

describe('classifySmartInput', () => {
  it('routes an IOC to lookup', () => {
    expect(classifySmartInput('https://example.com')).toMatchObject({ type: 'url', endpoint: 'lookup' });
  });

  it('routes labeled hash to lookup', () => {
    expect(classifySmartInput('SHA256: fcf5dbce80dd904652d4746dd6b26e34763cb07090573967ff6aa6c084496c16'))
      .toMatchObject({ type: 'hash', endpoint: 'lookup' });
  });

  it('detects an email header before treating it as a message', () => {
    const raw = 'From: support@example.com\nReceived: by mx.example.net\nAuthentication-Results: mx; spf=pass';
    expect(classifySmartInput(raw)).toMatchObject({ type: 'email-header', endpoint: 'email-header' });
  });

  it('routes free-form text to the message analyzer', () => {
    expect(classifySmartInput('Segera kirim OTP Anda agar akun tidak diblokir.'))
      .toMatchObject({ type: 'message', endpoint: 'message' });
  });

  it('keeps an ambiguous short token unsubmitted', () => {
    expect(classifySmartInput('contoh')).toMatchObject({ type: 'unknown', endpoint: null });
  });
});