'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AiContext, AiMessage, AiReply, AiScanResult } from '@/lib/ai/types';

const WELCOME: AiReply = {
  intent: 'general',
  status: 'Pendamping keamanan digital',
  tone: 'neutral',
  summary: 'Ceritakan apa yang membuat Anda ragu. Saya bisa menjelaskan hasil pemeriksaan, membantu memilih alat, atau menyusun langkah darurat.',
  why: [], actions: [],
  avoid: ['Jangan tulis OTP, PIN, kata sandi, nomor kartu, atau token di percakapan.'],
  escalation: [], sources: [], links: [],
  followUp: 'Apa yang Anda terima: tautan, pesan, email, berkas, kode QR, atau permintaan transfer?',
};

type ConversationItem = { role: 'user' | 'assistant'; content?: string; reply?: AiReply };

function readResult(): AiScanResult | null {
  try {
    const raw = sessionStorage.getItem('jagawarga:last-result');
    if (!raw) return null;
    const value = JSON.parse(raw);
    const evidence = Array.isArray(value.evidence) ? value.evidence.map((item: Record<string, unknown>) => {
      const details = item.details && typeof item.details === 'object' ? item.details as Record<string, unknown> : {};
      const attributes = details.attributes && typeof details.attributes === 'object' ? details.attributes as Record<string, unknown> : {};
      return {
        provider: String(item.provider || 'unknown'),
        verdict: typeof item.verdict === 'string' ? item.verdict : undefined,
        confidence: typeof item.confidence === 'number' ? item.confidence : undefined,
        reasonCodes: Array.isArray(item.reasonCodes) ? item.reasonCodes.filter((code): code is string => typeof code === 'string') : [],
        stats: attributes.last_analysis_stats && typeof attributes.last_analysis_stats === 'object' ? attributes.last_analysis_stats as Record<string, number> : undefined,
      };
    }) : [];
    return {
      indicator: value.indicator, risk: Number(value.risk) || 0, verdict: String(value.verdict || ''),
      confidence: value.confidence, checkedAt: value.checkedAt, partial: Boolean(value.partial),
      reasonCodes: Array.isArray(value.reasonCodes) ? value.reasonCodes : evidence.flatMap((item: { reasonCodes: string[] }) => item.reasonCodes),
      actions: Array.isArray(value.actions) ? value.actions : [], evidence,
    };
  } catch { return null; }
}

function pageLabel(pathname: string) {
  if (pathname === '/') return 'Beranda dan pemindai';
  if (pathname.startsWith('/result')) return 'Hasil pemeriksaan';
  if (pathname.startsWith('/details')) return 'Detail teknis';
  if (pathname.startsWith('/education')) return 'Materi edukasi';
  if (pathname.startsWith('/tools')) return 'Alat bantu';
  if (pathname.startsWith('/emergency')) return 'Panduan darurat';
  if (pathname.startsWith('/dashboard')) return 'Riwayat pemeriksaan';
  return 'JagaWarga';
}

function quickPrompts(pathname: string, hasResult: boolean) {
  if ((pathname.startsWith('/result') || pathname.startsWith('/details')) && hasResult) return [
    'Jelaskan hasil ini dengan bahasa sederhana', 'Apa yang paling perlu saya lakukan sekarang?', 'Saya sudah membuka tautannya. Apa langkah berikutnya?',
  ];
  if (pathname.startsWith('/emergency')) return [
    'Saya sudah transfer uang. Apa yang harus dilakukan?', 'Saya sudah memasang APK dari chat', 'Saya memberikan OTP kepada orang lain',
  ];
  if (pathname.startsWith('/tools')) return [
    'Alat mana yang cocok untuk bukti saya?', 'Bagaimana memeriksa email mencurigakan?', 'Apakah berkas diproses secara lokal?',
  ];
  if (pathname.startsWith('/education')) return [
    'Jelaskan phishing dengan contoh sederhana', 'Bagaimana mengenali APK palsu?', 'Beri saya latihan singkat',
  ];
  return ['Saya menerima tautan yang mencurigakan', 'Bagaimana mengenali pesan penipuan?', 'Saya baru ditelepon orang yang mengaku dari bank'];
}

function ReplyCard({ reply, onFeedback, feedbackSent }: { reply: AiReply; onFeedback: (helpful: boolean) => void; feedbackSent: boolean }) {
  return <article className={`ai-reply-card ai-tone-${reply.tone}`}>
    <div className="ai-reply-heading"><span>{reply.status}</span><strong>{reply.summary}</strong></div>
    {reply.why.length > 0 && <section><h3>Mengapa demikian?</h3><ul>{reply.why.map((item) => <li key={item}>{item}</li>)}</ul></section>}
    {reply.actions.length > 0 && <section className="ai-reply-actions"><h3>Yang dapat Anda lakukan</h3><ol>{reply.actions.map((item) => <li key={item}>{item}</li>)}</ol></section>}
    {reply.avoid.length > 0 && <section className="ai-reply-avoid"><h3>Hindari</h3><ul>{reply.avoid.map((item) => <li key={item}>{item}</li>)}</ul></section>}
    {reply.escalation.length > 0 && <section><h3>Jika perlu dilaporkan</h3><ul>{reply.escalation.map((item) => <li key={item}>{item}</li>)}</ul></section>}
    {reply.links.length > 0 && <nav className="ai-response-links" aria-label="Tindakan lanjutan">{reply.links.map((item) => (
      item.href.startsWith('/') ? <Link key={item.href} href={item.href}>{item.label}</Link> : <a key={item.href} href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
    ))}</nav>}
    {reply.sources.length > 0 && <details className="ai-sources"><summary>Sumber resmi</summary>{reply.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<small>Diverifikasi {source.verifiedAt}</small></a>)}</details>}
    {reply.followUp && <p className="ai-follow-up">{reply.followUp}</p>}
    <div className="ai-reply-feedback" aria-label="Nilai jawaban">
      {feedbackSent ? <span>Terima kasih atas masukannya.</span> : <><span>Jawaban ini membantu?</span><button type="button" onClick={() => onFeedback(true)}>Ya</button><button type="button" onClick={() => onFeedback(false)}>Belum</button></>}
    </div>
  </article>;
}

export function AiAssistant() {
  const pathname = usePathname() || '/';
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<ConversationItem[]>([{ role: 'assistant', reply: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AiScanResult | null>(null);
  const [notice, setNotice] = useState('');
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const prompts = useMemo(() => quickPrompts(pathname, Boolean(lastResult)), [pathname, lastResult]);

  useEffect(() => {
    setLastResult(readResult());
    try {
      const stored = sessionStorage.getItem('jagawarga:ai-conversation');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) setItems(parsed.slice(-10));
      }
    } catch { /* Ignore malformed local state. */ }
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    if (window.innerWidth <= 480) document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsOpen(false); launcherRef.current?.focus(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  useEffect(() => { if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [items, loading, isOpen]);

  function persist(next: ConversationItem[]) {
    setItems(next);
    try { sessionStorage.setItem('jagawarga:ai-conversation', JSON.stringify(next.slice(-10))); } catch { /* Keep in memory. */ }
  }

  async function send(value?: string) {
    const query = (value ?? input).trim();
    if (!query || loading) return;
    const pending = [...items, { role: 'user' as const, content: query }].slice(-10);
    persist(pending); setInput(''); setLoading(true); setNotice('');
    const messages: AiMessage[] = pending.map((item) => ({ role: item.role, content: item.content || item.reply?.summary || '' })).filter((message) => message.content);
    const context: AiContext = { pathname, lastResult };
    try {
      const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, context }) });
      const data = await response.json();
      if (!response.ok || !data.reply) throw new Error(data.error || 'FAILED');
      persist([...pending, { role: 'assistant' as const, reply: data.reply }].slice(-10));
    } catch (error) {
      setNotice(error instanceof Error && error.message === 'RATE_LIMITED' ? 'Terlalu banyak permintaan. Tunggu beberapa menit lalu coba kembali.' : 'Jawaban belum dapat dimuat. Periksa koneksi lalu coba kembali.');
    } finally { setLoading(false); }
  }

  function close() { setIsOpen(false); requestAnimationFrame(() => launcherRef.current?.focus()); }

  async function sendFeedback(reply: AiReply, helpful: boolean) {
    const key = `${reply.intent}:${reply.summary}`;
    setFeedback((current) => ({ ...current, [key]: true }));
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helpful, category: `ai-${reply.intent}` }),
    }).catch(() => undefined);
  }

  return <aside className="ai-assistant-wrapper no-print" aria-label="Pendamping keamanan digital">
    {!isOpen && <button ref={launcherRef} type="button" className="ai-fab-btn" onClick={() => setIsOpen(true)} aria-label="Buka pendamping keamanan digital">
      <span className="ai-brand-mark" aria-hidden="true">JW</span><span><b>Tanya JagaWarga</b><small>Pendamping keamanan</small></span>
    </button>}
    {isOpen && <div ref={dialogRef} className="ai-chat-window" role="dialog" aria-modal="true" aria-labelledby="ai-chat-title">
      <header className="ai-chat-header"><div className="ai-chat-title-group"><span className="ai-brand-mark" aria-hidden="true">JW</span><div><strong id="ai-chat-title">Pendamping JagaWarga</strong><span>{pageLabel(pathname)}</span></div></div><button type="button" className="ai-chat-close-btn" onClick={close}>Tutup</button></header>
      <div className="ai-privacy-note"><strong>Jaga data pribadi.</strong><span>Jangan tulis OTP, PIN, kata sandi, nomor kartu, atau token. Saat AI cloud aktif, pertanyaan diproses oleh penyedia model.</span><Link href="/privacy">Baca privasi</Link></div>
      {lastResult && <div className="ai-context-banner"><span>Hasil aktif</span><strong>{lastResult.indicator?.displayValue?.slice(0, 28) || 'Indikator terakhir'}</strong><b>{lastResult.risk}</b></div>}
      <div className="ai-messages-container" aria-live="polite" aria-busy={loading}>
        {items.map((item, index) => item.role === 'user' ? <div className="ai-user-message" key={`${item.content}-${index}`}>{item.content}</div> : item.reply && <ReplyCard key={`${item.reply.summary}-${index}`} reply={item.reply} onFeedback={(helpful) => sendFeedback(item.reply as AiReply, helpful)} feedbackSent={Boolean(feedback[`${item.reply.intent}:${item.reply.summary}`])} />)}
        {loading && <div className="ai-thinking"><span /><span /><span /><b>Menyusun panduan yang aman…</b></div>}<div ref={endRef} />
      </div>
      {notice && <p className="ai-error" role="alert">{notice}</p>}
      <div className="ai-quick-chips">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => send(prompt)} disabled={loading}>{prompt}</button>)}</div>
      <form className="ai-chat-input-form" onSubmit={(event) => { event.preventDefault(); send(); }}><label htmlFor="ai-question">Pertanyaan Anda</label><div><input ref={inputRef} id="ai-question" value={input} onChange={(event) => setInput(event.target.value)} maxLength={1_600} placeholder="Ceritakan situasinya…" disabled={loading} /><button type="submit" disabled={!input.trim() || loading}>Kirim</button></div></form>
    </div>}
  </aside>;
}