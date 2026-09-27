'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

type Result = { risk: number; verdict: string; reasonCodes: string[]; authentication: Record<string, string>; requestId: string };

export default function EmailHeaderTool() {
  const [headers, setHeaders] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setRequestId('');
    const response = await fetch('/api/analyze/email-header', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ headers }) });
    const data = await response.json();
    setRequestId(typeof data.requestId === 'string' ? data.requestId : '');
    if (response.ok) setResult(data);
    else { setResult(null); setError('Pemeriksaan header gagal. Periksa input atau coba kembali.'); }
  }
  return <main className="page"><Link href="/tools">← Semua alat</Link><p className="eyebrow">EMAIL HEADER</p><h1>Periksa autentikasi email.</h1><p>Hapus alamat pribadi bila tidak diperlukan. Header tidak disimpan.</p><form onSubmit={submit}><label htmlFor="headers">Raw email headers</label><textarea id="headers" value={headers} onChange={(e) => setHeaders(e.target.value)} maxLength={50_000} /><button disabled={!headers.trim()}>Periksa header</button></form>{error && <p role="alert">{error}{requestId && <> ID permintaan: <code>{requestId}</code>.</>}</p>}{result && <section className="panel"><h2>{result.verdict}</h2><p>Risk signal: {result.risk}/100</p><dl>{Object.entries(result.authentication).map(([key, value]) => <div key={key}><dt>{key.toUpperCase()}</dt><dd>{value}</dd></div>)}</dl><ul>{result.reasonCodes.map((item) => <li key={item}>{item}</li>)}</ul><p>ID permintaan: <code>{result.requestId}</code></p></section>}</main>;
}