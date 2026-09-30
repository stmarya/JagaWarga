'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './icon';

export function ProgressBreadcrumb({ current }: { current: 'result' | 'detail' }) {
  const steps = [
    { id: 'history', label: 'Riwayat', href: '/dashboard' },
    { id: 'result', label: 'Hasil', href: '/result' },
    { id: 'detail', label: 'Bukti teknis', href: '#' },
  ];
  const active = current === 'result' ? 1 : 2;
  return <nav className="progress-breadcrumb" aria-label="Tahapan pemeriksaan">{steps.map((step, index) => <div className={index < active ? 'done' : index === active ? 'active' : ''} key={step.id}>{index <= active && step.href !== '#' ? <Link href={step.href}><span>{index + 1}</span>{step.label}</Link> : <span className="progress-step"><span>{index + 1}</span>{step.label}</span>}{index < steps.length - 1 && <Icon name="arrow" size={16} />}</div>)}</nav>;
}

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return <button className="scroll-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Kembali ke atas"><Icon name="arrow" /></button>;
}