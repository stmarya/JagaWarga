const SENSITIVE = /token|password|secret|authorization|cookie/i;

export function safeLog(event: string, fields: Record<string, unknown> = {}) {
  if (process.env.LOG_LEVEL === 'silent') return;
  const redacted = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, SENSITIVE.test(key) ? '[REDACTED]' : value]),
  );
  console.info(JSON.stringify({ level: 'info', event, at: new Date().toISOString(), ...redacted }));
}