import Link from 'next/link';

const internal = [
  'Technical Fase 1–8 complete',
  'Automated QA dan fail-closed launch gate',
  'Protected production workflow',
  'SBOM, rollback, dan incident runbooks',
  'Public machine-readable launch status',
];
const external = [
  ['Human usability study', 11],
  ['Legal/privacy approval', 12],
  ['Provider Terms confirmation', 13],
  ['External penetration test', 14],
  ['Production infrastructure review', 15],
  ['Operator incident drill', 16],
] as const;
export default function LaunchReadiness() {
  return <main className="page">
    <Link href="/">← Beranda</Link>
    <p className="eyebrow">LAUNCH READINESS · v0.8.0</p>
    <h1>NO-GO: kontrol teknis siap, persetujuan eksternal belum lengkap.</h1>
    <p>Fase 8 selesai. Fase 9 baru dapat dimulai setelah seluruh evidence terverifikasi oleh launch gate.</p>
    <div className="grid">
      <section className="panel"><h2>Internal readiness</h2><ul>{internal.map((item) => <li key={item}>✅ {item}</li>)}</ul></section>
      <section className="panel"><h2>External gates</h2><ul>{external.map(([item, issue]) => <li key={item}>⏳ <a href={`https://github.com/stmarya/JagaWarga/issues/${issue}`}>{item}</a></li>)}</ul></section>
    </div>
    <p><a href="/launch-status.json">Baca status machine-readable</a>. Halaman ini bukan persetujuan public launch.</p>
  </main>;
}