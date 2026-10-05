export type AiThreat = {
  kind: 'none' | 'phishing' | 'social_engineering' | 'mixed';
  label: string;
  confidence: 'low' | 'medium' | 'high';
  signals: string[];
};

export type AiMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AiEvidence = {
  provider: string;
  verdict?: string;
  confidence?: number;
  reasonCodes: string[];
  stats?: Record<string, number>;
};

export type AiScanResult = {
  indicator?: { type: string; displayValue: string };
  risk: number;
  verdict: string;
  confidence?: string;
  checkedAt?: string;
  partial?: boolean;
  reasonCodes: string[];
  actions: string[];
  evidence: AiEvidence[];
};

export type AiContext = {
  pathname: string;
  lastResult: AiScanResult | null;
};

export type AiSource = {
  label: string;
  url: string;
  verifiedAt: string;
};

export type AiLink = {
  label: string;
  href: string;
};

export type AiReply = {
  intent: 'result' | 'emergency' | 'education' | 'tool' | 'general';
  status: string;
  tone: 'neutral' | 'danger' | 'warning' | 'safe';
  summary: string;
  why: string[];
  actions: string[];
  avoid: string[];
  escalation: string[];
  sources: AiSource[];
  links: AiLink[];
  followUp?: string;
  threat?: AiThreat;
};