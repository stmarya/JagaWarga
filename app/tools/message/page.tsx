'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { addXp } from '@/lib/client/storage';

type Result = { risk: number; verdict: string; reasonCodes: string[]; actions: string[] };

export default function MessageTool() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/analyze/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    if (response.ok) { setResult(await response.json()); addXp(15); }
  }
  return <main className="page"><Link href="/tools">← Semua alat</Link><p className="eyebrow">ANALISIS PESAN</p><h1>Kenali pola phishing.</h1><p>Pesan dianalisis sementara dan tidak disimpan.</p><form onSubmit={submit}><label htmlFor="message">Tempel pesan tanpa data pribadi</label><textarea id="message" value={text} onChange={(e) => setText(e.target.value)} /><button disabled={!text.trim()}>Analisis</button></form>{result && <section className="panel"><h2>{result.verdict}</h2><p>Risk signal: {result.risk}/100 — bukan vonis otomatis.</p><h3>Alasan</h3><ul>{result.reasonCodes.map((item) => <li key={item}>{item}</li>)}</ul><h3>Tindakan</h3><ul>{result.actions.map((item) => <li key={item}>{item}</li>)}</ul></section>}</main>;
}