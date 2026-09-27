import Link from 'next/link';

const internal = ['Technical Fase 1–6 complete', 'Automated QA', 'Release workflow', 'SBOM', 'Rollback and incident runbooks'];
const external = ['Human usability study', 'Legal/privacy approval', 'Provider Terms confirmation', 'External penetration test', 'Production infrastructure review', 'Operator incident drill'];
export default function LaunchReadiness() {
  return <main className="page"><Link href="/">← Beranda</Link><p className="eyebrow">LAUNCH READINESS</p><h1>Technical pack ready. External approval pending.</h1><div className="grid"><section className="panel"><h2>Internal readiness</h2><ul>{internal.map((item) => <li key={item}>✅ {item}</li>)}</ul></section><section className="panel"><h2>External gates</h2><ul>{external.map((item) => <li key={item}>⏳ {item}</li>)}</ul></section></div><p>Halaman ini bukan pernyataan bahwa produk telah disetujui untuk public launch.</p></main>;
}