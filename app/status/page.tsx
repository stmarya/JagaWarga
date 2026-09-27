'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Health = {
  status: string;
  version: string;
  providers: string[];
  policy: Record<string, boolean>;
  providerDiagnostics: Array<{ name: string; kind: string; status: string; reason: string }>;
  reputationPolicy: { acceptedSingleProviderLimitation: boolean; limitation: string };
};
const diagnosticReason: Record<string, string> = {
  configured: 'siap digunakan',
  'feature-disabled': 'fitur provider premium belum diaktifkan',
  'missing-key': 'API key belum tersedia pada environment proses aplikasi',
  'key-must-be-single-value': 'gunakan tepat satu API key; daftar dipisahkan koma tidak didukung',
  'kill-switch': 'dinonaktifkan oleh kill switch',
};
export default function StatusPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { fetch('/api/health').then((response) => { if (!response.ok) throw new Error('HEALTH_FAILED'); return response.json(); }).then(setHealth).catch(() => setFailed(true)); }, []);
  const reputationReady = health?.providerDiagnostics.some((provider) => provider.kind === 'reputation' && provider.status === 'enabled');
  return <main className="page"><Link href="/">← Beranda</Link><p className="eyebrow">STATUS</p><h1>{failed ? 'Status tidak dapat dimuat.' : !health ? 'Memeriksa status…' : reputationReady ? 'Lookup reputasi aktif.' : 'Metadata aktif; provider reputasi belum siap.'}</h1>{health && <><section className="panel"><p>Versi {health.version}</p><p>Provider aktif: {health.providers.join(', ') || 'Tidak ada'}</p><p>URL submission: {health.policy.urlSubmission ? 'aktif' : 'nonaktif'}</p><p>File upload: {health.policy.fileUpload ? 'aktif' : 'nonaktif'}</p></section><section className="panel"><h2>Provider</h2><ul>{health.providerDiagnostics.map((provider) => <li key={provider.name}><strong>{provider.name}</strong>: {provider.status} — {diagnosticReason[provider.reason] ?? provider.reason}</li>)}</ul><p><strong>Batasan:</strong> {health.reputationPolicy.limitation}</p></section></>}</main>;
}