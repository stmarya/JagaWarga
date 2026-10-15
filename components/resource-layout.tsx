import Link from 'next/link';
import type { ReactNode } from 'react';
export function ResourceLayout({kicker,title,intro,children}:{kicker:string;title:string;intro:string;children:ReactNode}) {
 return <main className="compact-page experience-page resource-page"><div className="resource-context"><Link href="/">Beranda</Link><span aria-hidden="true"> / </span><span>{kicker}</span></div><header className="v4-heading"><p className="kicker">{kicker}</p><h1>{title}</h1><p>{intro}</p></header>{children}<nav className="v4-related" aria-label="Informasi terkait"><strong>Pelajari batas layanan</strong><div className="v4-actions"><Link href="/privacy">Privasi & data</Link><Link href="/methodology">Metode pemeriksaan</Link><Link href="/transparency">Transparansi</Link><Link href="/support">Bantuan</Link><Link href="/launch-readiness">Kesiapan rilis</Link></div></nav></main>;
}
