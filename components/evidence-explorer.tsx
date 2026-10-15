'use client';
import { useState } from 'react';
import { downloadJson, readSnapshot, type LookupSnapshot } from '@/lib/analyst/snapshot';
export function EvidenceExplorer({ result }: { result: LookupSnapshot }) {
  const [notice, setNotice] = useState('');
  return <section className="content-card batch-card analyst-evidence" aria-label="Evidence explorer">
    <h2>Bukti pemeriksaan</h2><p className="analyst-indicator"><strong>{result.indicator.displayValue}</strong></p>
    <dl className="analyst-facts">
      <div><dt>Verdict / severity</dt><dd>{result.verdict} · {result.risk}/100</dd></div>
      <div><dt>Confidence</dt><dd>{result.confidence} (heuristik, bukan probabilitas)</dd></div>
      <div><dt>Coverage sumber</dt><dd>{result.coverage.assessed} dapat menilai / {result.coverage.requested} diminta · {result.coverage.failed} gagal</dd></div>
      <div><dt>Kebijakan scoring</dt><dd>{result.scoringVersion}</dd></div><div><dt>Diperiksa</dt><dd>{result.checkedAt}</dd></div><div><dt>Request ID</dt><dd>{result.requestId}</dd></div>
    </dl><p>Skor menunjukkan tingkat sinyal, bukan peluang terjadinya serangan. Tidak ada indikasi bukan jaminan aman. DNS bukan sumber reputasi.</p>
    {result.verdict === 'insufficient-data' && <p className="batch-alert">Data belum cukup untuk menilai. Skor rendah tidak berarti aman.</p>}
    {result.coverage.failed > 0 && <p className="batch-alert">Sebagian sumber gagal; hasil belum lengkap.</p>}
    {result.conflictingEvidence && <p className="batch-alert">Sumber berbeda pendapat. Sinyal ancaman dipertahankan; lakukan review konteks.</p>}
    <h3>Observasi provider, bukan atribusi pelaku</h3><div className="evidence-source-cards">{result.evidence.map((e, i) => <article key={`${e.provider}-${i}`}>
      <h4>{e.provider}</h4><p>{e.verdict} · confidence sumber {Math.round(e.confidence * 100)}% (heuristik)</p>
      {e.freshness === 'stale' && <p className="batch-alert">Evidence lama; kondisi sekarang dapat berbeda.</p>}
      <dl className="analyst-facts"><div><dt>Waktu observasi</dt><dd>{e.observedAt ?? 'Tidak tersedia'}</dd></div><div><dt>Waktu pengambilan</dt><dd>{e.fetchedAt}</dd></div><div><dt>Freshness saat lookup</dt><dd>{e.freshness ?? 'unknown'}</dd></div></dl>
      <details><summary>Reason codes · {e.reasonCodes.length}</summary><ul>{e.reasonCodes.map((code, n) => <li key={`${code}-${n}`}><code>{code}</code></li>)}</ul></details>
    </article>)}</div>{!result.evidence.length && <p>Tidak ada observasi sumber dalam snapshot ini.</p>}
    <button className="batch-secondary" type="button" onClick={() => { try { downloadJson('jagawarga-evidence.json', readSnapshot(result)); setNotice('Evidence normalisasi diekspor.'); } catch { setNotice('Ekspor gagal. Periksa data dan izin unduhan browser.'); } }}>Ekspor evidence JSON</button>
    <p>Ekspor terbatas pada evidence ternormalisasi; metadata mentah provider tidak disertakan. Tinjau indikator sebelum membagikan.</p><p role="status">{notice}</p>
  </section>;
}
