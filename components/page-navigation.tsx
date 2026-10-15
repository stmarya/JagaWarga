'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './icon';
export function ProgressBreadcrumb({ current, resultHref = '/result' }: { current: 'result' | 'detail'; resultHref?: string }) {
  const steps = [{ label: 'Periksa', href: '/periksa' }, { label: 'Hasil', href: resultHref }, { label: 'Bukti teknis', href: '' }];
  const active = current === 'result' ? 1 : 2;
  return <nav className="progress-breadcrumb" aria-label="Tahapan pemeriksaan"><ol>{steps.map((step, index) => <li className={index < active ? 'done' : index === active ? 'active' : ''} key={step.label}>
    {index < active ? <Link href={step.href}><span>{index + 1}</span>{step.label}</Link> : <span className="progress-step" aria-current={index === active ? 'step' : undefined}><span>{index + 1}</span>{step.label}</span>}
    {index < steps.length - 1 && <Icon name="arrow" size={16} />}</li>)}</ol></nav>;
}
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const onScroll = () => setVisible(window.scrollY > 500); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll); }, []);
  if (!visible) return null;
  return <button className="scroll-top batch-scroll-top no-print" type="button" onClick={() => {
    const target = document.getElementById('main-content'); target?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }}><Icon name="arrow" /><span>Kembali ke atas</span></button>;
}
