import { describe, expect, it } from 'vitest';
import { resolveLocale } from './i18n';
describe('resolveLocale', () => {
  it('supports Indonesian and English with Indonesian default', () => {
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('id-ID')).toBe('id');
    expect(resolveLocale()).toBe('id');
  });
});