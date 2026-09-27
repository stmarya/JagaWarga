export type EmailHeaderAnalysis = {
  risk: number;
  verdict: 'suspicious' | 'needs-review' | 'low-signal';
  reasonCodes: string[];
  authentication: { spf: string; dkim: string; dmarc: string };
};

function field(headers: string, name: string) {
  const match = headers.match(new RegExp(`^${name}:\\s*(.+)$`, 'im'));
  return match?.[1]?.trim() ?? '';
}

function authValue(value: string, method: string) {
  return value.match(new RegExp(`\\b${method}=(pass|fail|softfail|neutral|none|temperror|permerror)\\b`, 'i'))?.[1]?.toLowerCase() ?? 'unknown';
}

function domainFromAddress(value: string) {
  return value.match(/@([a-z0-9.-]+)/i)?.[1]?.toLowerCase() ?? '';
}

export function analyzeEmailHeader(raw: string): EmailHeaderAnalysis {
  const headers = raw.replace(/\r?\n[ \t]+/g, ' ').slice(0, 50_000);
  const auth = field(headers, 'Authentication-Results');
  const authentication = {
    spf: authValue(auth, 'spf'),
    dkim: authValue(auth, 'dkim'),
    dmarc: authValue(auth, 'dmarc'),
  };
  const reasons: string[] = [];
  let risk = 0;
  for (const [method, result] of Object.entries(authentication)) {
    if (['fail', 'softfail', 'permerror'].includes(result)) {
      reasons.push(`${method.toUpperCase()}_FAIL`);
      risk += method === 'dmarc' ? 35 : 20;
    }
  }
  const fromDomain = domainFromAddress(field(headers, 'From'));
  const replyDomain = domainFromAddress(field(headers, 'Reply-To'));
  if (fromDomain && replyDomain && fromDomain !== replyDomain) {
    reasons.push('FROM_REPLY_TO_MISMATCH');
    risk += 25;
  }
  if (!field(headers, 'Received')) {
    reasons.push('NO_RECEIVED_CHAIN');
    risk += 10;
  }
  risk = Math.min(100, risk);
  return {
    risk,
    verdict: risk >= 60 ? 'suspicious' : risk >= 20 ? 'needs-review' : 'low-signal',
    reasonCodes: reasons,
    authentication,
  };
}