'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

type Result = { risk: number; verdict: string; reasonCodes: string[]; authentication: Record<string, string> };

export default function EmailHeaderTool() {
  const [headers, setHeaders] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/analyze/email-header', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ headers }) });
    if (response.ok) setResult(await response.json());
  }
  return <main className="page"><Link href="/tools">← Semua alat</Link><p className="eyebrow">EMAIL HEADER</p><h1>Periksa autentikasi email.</h1><p>Hapus alamat pribadi bila tidak diperlukan. Header tidak disimpan.</p><form onSubmit={submit}><label htmlFor="headers">Raw email headers</label><textarea id="headers" value={headers} onChange={(e) => setHeaders(e.target.value)} /><button disabled={!headers.trim()}>Periksa header</button></form>{result && <section className="panel"><h2>{result.verdict}</h2><p>Risk signal: {result.risk}/100</p><dl>{Object.entries(result.authentication).map(([key, value]) => <div key={key}><dt>{key.toUpperCase()}</dt><dd>{value}</dd></div>)}</dl><ul>{result.reasonCodes.map((item) => <li key={item}>{item}</li>)}</ul></section>}</main>;
}