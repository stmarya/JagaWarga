'use client';
import Link from 'next/link';
import { ChangeEvent, useState } from 'react';

export default function FileHashTool() {
  const [result, setResult] = useState('');
  const [name, setName] = useState('');
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setName(file.name);
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    setResult([...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''));
  }
  return <main className="page"><Link href="/tools">← Semua alat</Link><p className="eyebrow">HASH FILE LOKAL</p><h1>Hitung SHA-256 tanpa upload.</h1><section className="panel"><label htmlFor="file">Pilih file</label><input id="file" type="file" onChange={select} /><p>File diproses hanya di browser dan tidak dikirim ke server.</p>{result && <><strong>{name}</strong><textarea readOnly value={result} aria-label="SHA-256 hash" /></>}</section></main>;
}