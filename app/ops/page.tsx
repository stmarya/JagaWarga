'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Snapshot = Record<string, unknown>;
export default function OperationsPage() {
  const [data, setData] = useState<Record<string, Snapshot>>({});
  useEffect(() => {
    Promise.all(['/api/health', '/api/ready', '/api/version', '/api/policy'].map(async (path) => [path, await fetch(path).then((r) => r.json())] as const))
      .then((entries) => setData(Object.fromEntries(entries))).catch(() => undefined);
  }, []);
  return <main className="page"><Link href="/">← Beranda</Link><p className="eyebrow">OPERATIONS</p><h1>Operational readiness.</h1><div className="grid">{Object.entries(data).map(([path, value]) => <section className="panel" key={path}><h2>{path}</h2><pre>{JSON.stringify(value, null, 2)}</pre></section>)}</div><p>Metrics detail dilindungi dan tidak ditampilkan pada halaman publik.</p></main>;
}