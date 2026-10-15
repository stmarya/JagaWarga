'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { completeEducation, getProgress } from '@/lib/client/storage';
import { readCatalog, readLearningTopic, type LearningLevel, type LearningTopic, type TopicSummary } from '@/lib/client/education';
import { Icon, type IconName } from '@/components/icon';
const icons: Record<string, IconName> = { phishing:'alert', password:'key', mfa:'shield', device:'device', network:'network', privacy:'privacy', malware:'file', transaction:'transaction', work:'work', 'ai-misinformation':'spark', 'safe-chat':'message', 'incident-response':'alert' };
const levels: Array<[LearningLevel,string,string]> = [['beginner','Dasar','Baru mulai belajar'],['intermediate','Menengah','Sudah paham dasar'],['advanced','Lanjutan','Untuk pengelola dan tim']];
export default function EducationPage() {
 const [topics,setTopics]=useState<TopicSummary[]>([]); const [topic,setTopic]=useState<LearningTopic|null>(null);
 const [busy,setBusy]=useState(false); const [loaded,setLoaded]=useState(false); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
 const [level,setLevel]=useState<LearningLevel>('beginner'); const [search,setSearch]=useState(''); const [lesson,setLesson]=useState(0);
 const [quiz,setQuiz]=useState<number|null>(null); const [answer,setAnswer]=useState<number|null>(null); const [score,setScore]=useState(0); const [completed,setCompleted]=useState<string[]>([]);
 const controller=useRef<AbortController|null>(null); const heading=useRef<HTMLHeadingElement>(null);
 async function load(slug?: string) {
  controller.current?.abort(); const current=new AbortController(); controller.current=current; setBusy(true);setError('');setNotice('');
  const timer=setTimeout(()=>current.abort(),12000);
  try {
   const response=await fetch(slug?`/api/education?slug=${encodeURIComponent(slug)}`:'/api/education',{signal:current.signal});
   if(!response.ok) throw new Error('Materi belum tersedia. Coba lagi.');
   const raw=await response.text(); if(raw.length>1000000) throw new Error('Respons materi terlalu besar.');
   const data:unknown=JSON.parse(raw); if(current.signal.aborted)return;
   if(slug){setTopic(readLearningTopic(data,slug));setLesson(0);setQuiz(null);setAnswer(null);setScore(0);}else{setTopics(readCatalog(data));setLoaded(true);}
  }catch(e){if(controller.current===current)setError(current.signal.aborted?'Pemuatan melewati batas waktu. Silakan coba lagi.':e instanceof Error&&e.message.startsWith('Materi')?e.message:'Materi tidak dapat dimuat. Periksa koneksi lalu coba lagi.');}
  finally{clearTimeout(timer);if(controller.current===current)setBusy(false);}
 }
 useEffect(()=>{void load();setCompleted(getProgress().completedTopics??[]);const sync=()=>setCompleted(getProgress().completedTopics??[]);window.addEventListener('storage',sync);return()=>{controller.current?.abort();window.removeEventListener('storage',sync);};},[]);
 useEffect(()=>{if(topic){heading.current?.focus();heading.current?.scrollIntoView({block:'start',behavior:'instant'});}},[topic,quiz]);
 const finished=!!topic&&quiz!==null&&quiz>=topic.questions.length;
 const question=topic&&quiz!==null&&!finished?topic.questions[quiz]:null;
 function back(){setTopic(null);setQuiz(null);setError('');setNotice('');}
 function next(){if(quiz===null||answer===null)return;setQuiz(quiz+1);setAnswer(null);}
 function saveCompletion(){if(!topic)return;try{const result=completeEducation(topic.slug);setCompleted(result.completedTopics??[]);setNotice('Penyelesaian disimpan di browser ini. Mengulang topik tidak menambah XP lagi.');}catch{setNotice('Progres tidak dapat disimpan. Hasil latihan tetap dapat dibaca; periksa izin penyimpanan browser.');}}
 return <main className="compact-page experience-page education-v4">
  <div className="resource-context"><Link href="/">Beranda</Link><span aria-hidden="true"> / </span><span>Edukasi</span></div>
  {topic?<>
   <button className="v4-secondary" onClick={back} disabled={busy}>← Semua topik</button>
   <header className="v4-heading"><p className="kicker">{finished?'RINGKASAN LATIHAN':quiz!==null?'EVALUASI MANDIRI':'MODUL KEAMANAN DIGITAL'}</p><h1 ref={heading} tabIndex={-1}>{question?question.prompt:topic.title}</h1><p>{topic.description}</p></header>
   {finished?<section className="v4-card learning-summary"><h2>Latihan selesai, tetap lanjut belajar.</h2><p>Skor latihan <strong>{score} dari {topic.questions.length}</strong>. Ini catatan belajar mandiri, bukan sertifikasi kompetensi atau jaminan kesiapan menangani insiden.</p><p>{topic.lessons.length} materi · {topic.badge}</p><div className="v4-actions"><button className="v4-primary" onClick={saveCompletion} disabled={completed.includes(topic.slug)}>{completed.includes(topic.slug)?'Sudah tersimpan lokal':'Simpan penyelesaian di browser'}</button><button className="v4-secondary" onClick={()=>{setQuiz(0);setScore(0);setAnswer(null);setNotice('');}}>Ulangi latihan</button><button className="v4-secondary" onClick={()=>window.print()}>Cetak ringkasan belajar</button></div><p>Opsional: penyelesaian menambah 50 XP satu kali per topik pada data browser ini. Data tidak dienkripsi; penghapusan data browser menghapus progres. <Link href="/privacy">Kelola data lokal</Link>.</p></section>
   :question?<section className="v4-card"><p className="v4-meta">Pertanyaan {(quiz??0)+1} dari {topic.questions.length} · Skor {score}</p><div className="v4-quiz" role="group" aria-label="Pilihan jawaban">{question.options.map((option,i)=><button key={i} disabled={answer!==null} aria-pressed={answer===i} className={answer===i?'selected':''} onClick={()=>{if(answer===null){setAnswer(i);if(i===question.answer)setScore(s=>s+1);}}}>{option}</button>)}</div>{answer!==null&&<div className="v4-feedback" role="status"><strong>{answer===question.answer?'Benar.':'Belum tepat.'}</strong> {question.explanation}<p>Jawaban yang disarankan: {question.options[question.answer]}</p></div>}<div className="v4-actions"><button className="v4-secondary" onClick={()=>{setQuiz(null);setAnswer(null);}}>Kembali ke materi</button><button className="v4-primary" disabled={answer===null} onClick={next}>{quiz===topic.questions.length-1?'Lihat ringkasan':'Pertanyaan berikutnya'}</button></div></section>
   :<div className="v4-lesson-layout"><nav className="v4-lesson-nav" aria-label="Submateri">{topic.lessons.map((item,i)=><button key={i} aria-current={lesson===i?'step':undefined} onClick={()=>setLesson(i)}><span>{String(i+1).padStart(2,'0')}</span>{item.title}</button>)}</nav><article className="v4-card"><p className="v4-meta">Submateri {lesson+1} dari {topic.lessons.length}</p><h2>{topic.lessons[lesson].title}</h2><p>{topic.lessons[lesson].summary}</p><div className="v4-guidance"><section><h3>Lakukan</h3><p>{topic.lessons[lesson].safe}</p></section><section><h3>Hindari</h3><p>{topic.lessons[lesson].risky}</p></section></div><div className="v4-actions"><button className="v4-secondary" disabled={lesson===0} onClick={()=>setLesson(lesson-1)}>Sebelumnya</button>{lesson<topic.lessons.length-1?<button className="v4-primary" onClick={()=>setLesson(lesson+1)}>Materi berikutnya</button>:<button className="v4-primary" onClick={()=>{setQuiz(0);setScore(0);setAnswer(null);}}>Mulai evaluasi</button>}</div></article></div>}
  </>:<>
   <header className="v4-heading"><p className="kicker">BELAJAR KEAMANAN DIGITAL</p><h1>Belajar bertahap. Latih keputusan Anda.</h1><p>Pilih tingkat, baca contoh, lalu uji pemahaman. Tidak ada tautan berbahaya atau berkas yang perlu dijalankan dalam latihan ini.</p></header>
   <div className="v4-notice"><strong>Belajar, bukan sertifikasi.</strong><p>{completed.length} topik disimpan selesai di browser ini. Penyimpanan progres bersifat opsional setelah latihan; tidak ada pengiriman progres ke komunitas.</p></div>
   <div className="v4-levels" role="group" aria-label="Pilih tingkat belajar">{levels.map(([id,label,copy])=><button key={id} aria-pressed={level===id} onClick={()=>setLevel(id)}><strong>{label}</strong><span>{copy}</span></button>)}</div>
   <label className="v4-label" htmlFor="education-search">Cari materi pada tingkat ini</label><input id="education-search" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Misalnya: akun, pesan, insiden" />
   <p className="v4-meta">Materi lanjutan tetap berupa panduan defensif, bukan izin menguji sistem milik orang lain.</p>
   {loaded&&<section className="v4-topic-grid" aria-label="Topik belajar">{topics.filter(t=>t.level===level&&`${t.title} ${t.description}`.toLowerCase().includes(search.trim().toLowerCase())).map(t=><button className="v4-topic" key={t.slug} disabled={busy} onClick={()=>void load(t.slug)}><Icon name={icons[t.slug]??'book'} size={28}/><strong>{t.title}</strong><span>{t.description}</span><small>{t.lessonCount} materi · {t.questionCount} pertanyaan{completed.includes(t.slug)?' · Selesai lokal':''}</small><b>Buka materi →</b></button>)}</section>}
   {loaded&&!topics.some(t=>t.level===level&&`${t.title} ${t.description}`.toLowerCase().includes(search.trim().toLowerCase()))&&<div className="v4-card"><h2>Tidak ada materi yang cocok.</h2><p>Ubah kata pencarian atau pilih tingkat lain.</p><button className="v4-secondary" onClick={()=>setSearch('')}>Hapus pencarian</button></div>}
  </>}
  <div role="status" aria-live="polite">{busy?'Memuat materi…':error||notice}</div>{error&&<button className="v4-secondary" disabled={busy} onClick={()=>void load()}>Muat ulang katalog</button>}
  <aside className="v4-related"><strong>Sudah terdampak insiden?</strong><p>Jangan menunggu latihan selesai. <Link href="/emergency">Buka langkah darurat</Link>. Hapus data pribadi sebelum membagikan pertanyaan atau tangkapan layar.</p></aside>
 </main>;
}
