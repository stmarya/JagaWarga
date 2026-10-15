'use client';
import { useEffect, useRef, useState } from 'react';
import { ResourceLayout } from '@/components/resource-layout';
const paths=['/api/health','/api/ready','/api/version','/api/policy','/api/slo'] as const;
type Entry={path:string;ok:boolean;data:unknown;error?:string};
export default function OperationsPage(){
 const [entries,setEntries]=useState<Entry[]>([]);const [busy,setBusy]=useState(false);const controller=useRef<AbortController|null>(null);
 async function load(){controller.current?.abort();const active=new AbortController();controller.current=active;setBusy(true);setEntries([]);const timer=setTimeout(()=>active.abort(),10000);
 const result=await Promise.all(paths.map(async(path):Promise<Entry>=>{try{const r=await fetch(path,{signal:active.signal,cache:'no-store'});const raw=await r.text();if(raw.length>100000)throw new Error();const data:unknown=JSON.parse(raw);return{path,ok:r.ok,data,...(!r.ok?{error:`HTTP ${r.status}; status belum siap.`}:{})};}catch{return{path,ok:false,data:null,error:'Tidak dapat dibaca atau melewati batas waktu.'};}}));clearTimeout(timer);if(controller.current===active){setEntries(result);setBusy(false);}}
 useEffect(()=>{void load();return()=>{controller.current?.abort();controller.current=null;};},[]);
 return <ResourceLayout kicker="OPERASIONAL" title="Periksa status, bukan asumsi kesiapan." intro="Snapshot endpoint publik saat dimuat. Status HTTP berhasil tidak sama dengan persetujuan rilis atau jaminan keamanan."><section className="v4-notice"><p>Metrics detail tetap dilindungi. Jangan memasukkan token admin atau rahasia ke halaman publik.</p><button className="v4-secondary" disabled={busy} onClick={()=>void load()}>Muat ulang status</button><p role="status">{busy?'Memuat lima endpoint…':`${entries.filter(e=>e.ok).length} dari ${paths.length} endpoint dapat dibaca dengan respons HTTP berhasil.`}</p></section><div className="v4-status-grid">{entries.map(e=><section className="v4-card" key={e.path}><h2>{e.path}</h2><p>{e.ok?'Respons tersedia; tinjau isinya.':e.error}</p>{e.data!==null&&<details><summary>Lihat respons JSON</summary><pre tabIndex={0}>{JSON.stringify(e.data,null,2)}</pre></details>}</section>)}</div></ResourceLayout>;
}
