'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Health = { status: string; version: string; providers: string[]; policy: Record<string, boolean> };
export default function StatusPage() {
  const [health, setHealth] = useState<Health | null>(null);
  useEffect(() => { fetch('/api/health').then((response) => response.json()).then(setHealth).catch(() => setHealth(null)); }, []);
  return <main className="page"><Link href="/">← Beranda</Link><p className="eyebrow">STATUS</p><h1>{health?.status === 'ok' ? 'Semua sistem teknis tersedia.' : 'Memeriksa status…'}</h1>{health && <section className="panel"><p>Versi {health.version}</p><p>Provider: {health.providers.join(', ')}</p><p>URL submission: {health.policy.urlSubmission ? 'aktif' : 'nonaktif'}</p><p>File upload: {health.policy.fileUpload ? 'aktif' : 'nonaktif'}</p></section>}</main>;
}