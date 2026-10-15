'use client';

import { downloadJson, type LookupSnapshot } from '@/lib/analyst/snapshot';

export function EvidenceExplorer({ result }: { result: LookupSnapshot }) {
  return <section className="content-card analyst-evidence" aria-label="Evidence explorer">
    <h2>Bukti pemeriksaan</h2>
    <p className="analyst-indicator">{result.indicator.displayValue}</p>
    <dl className="analyst-facts">
      <div><dt>Verdict / severity</dt><dd>{result.verdict} · {result.risk}/100</dd></div>
      <div><dt>Confidence</dt><dd>{result.confidence} (heuristik, bukan probabilitas)</dd></div>
      <div><dt>Coverage sumber</dt><dd>{result.coverage.assessed} dapat menilai / {result.coverage.requested} diminta · {result.coverage.failed} gagal</dd></div>
      <div><dt>Kebijakan scoring</dt><dd>{result.scoringVersion}</dd></div>
      <div><dt>Diperiksa</dt><dd>{result.checkedAt}</dd></div>
      <div><dt>Request ID</dt><dd>{result.requestId}</dd></div>
    </dl>
    <p>Skor menunjukkan tingkat sinyal, bukan peluang terjadinya serangan. Tidak ada indikasi bukan jaminan aman. DNS bukan sumber reputasi.</p>
    {result.conflictingEvidence && <p role="status">Sumber berbeda pendapat. Sinyal ancaman dipertahankan; lakukan review konteks.</p>}
    <div className="analyst-scroll" tabIndex={0} role="region" aria-label="Tabel evidence, geser untuk kolom tambahan">
      <table><caption>Observasi provider, bukan kesimpulan atribusi pelaku</caption><thead><tr>
        <th scope="col">Sumber</th><th scope="col">Verdict</th><th scope="col">Confidence</th><th scope="col">Waktu observasi</th><th scope="col">Waktu pengambilan</th><th scope="col">Freshness saat lookup</th><th scope="col">Reason codes</th>
      </tr></thead><tbody>{result.evidence.map((e, i) => <tr key={`${e.provider}-${i}`}>
        <th scope="row">{e.provider}</th><td>{e.verdict}</td><td>{Math.round(e.confidence * 100)}%</td>
        <td>{e.observedAt ?? 'Tidak tersedia'}</td><td>{e.fetchedAt}</td><td>{e.freshness ?? 'unknown'}</td><td>{e.reasonCodes.join(', ')}</td>
      </tr>)}</tbody></table>
    </div>
    <button type="button" onClick={() => downloadJson('jagawarga-evidence.json', result)}>Ekspor evidence JSON</button>
    <p>Ekspor terbatas pada evidence ternormalisasi; metadata mentah provider tidak disertakan. Tinjau indikator sebelum membagikan.</p>
  </section>;
}