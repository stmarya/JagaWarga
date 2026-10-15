'use client';
import Link from 'next/link';
export function InvestigationNav({ current }: { current: 'triage' | 'cases' | 'tools' }) {
  return <nav className="investigation-nav no-print" aria-label="Area investigasi">
    <Link href="/analyst" aria-current={current === 'triage' ? 'page' : undefined}>Bulk triage</Link>
    <Link href="/analyst/cases" aria-current={current === 'cases' ? 'page' : undefined}>Kasus lokal</Link>
    <Link href="/tools" aria-current={current === 'tools' ? 'location' : undefined}>Alat investigasi</Link>
  </nav>;
}
