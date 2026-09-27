import { safeLog } from './observability';

const ALLOWED_EVENTS = new Set([
  'provider_disabled',
  'provider_enabled',
  'feature_flag_changed',
  'release_started',
  'release_rolled_back',
]);

export function auditEvent(event: string, metadata: Record<string, string | number | boolean> = {}) {
  if (!ALLOWED_EVENTS.has(event)) throw new Error('AUDIT_EVENT_NOT_ALLOWED');
  safeLog('audit_event', { auditType: event, ...metadata });
}