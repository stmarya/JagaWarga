import { describe, expect, it } from 'vitest';
import { auditEvent } from './audit';
describe('auditEvent', () => {
  it('rejects unapproved event names', () => {
    expect(() => auditEvent('raw_user_content')).toThrow('AUDIT_EVENT_NOT_ALLOWED');
  });
});