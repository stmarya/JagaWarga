'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/icon';

type TourStep = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  selector: string;
  actionGuide: string;
  attentionGuide: string;
  points: string[];
  interactiveDemo?: {
    label: string;
    description: string;
  };
};

const TOUR_STORAGE_KEY = 'jagawarga:orientation-completed';
const TOUR_BANNER_DISMISSED_KEY = 'jagawarga:orientation-banner-dismissed';

export function OrientationTour() {
  const pathname = usePathname() || '/';
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const steps: TourStep[] = [
    {
      id: 'welcome',
      badge: 'Langkah 1 dari 5 · Pengenalan',
      title: 'Pusat Cek Digital Mandiri',
      subtitle: 'Cek sebelum percaya, periksa sebelum klik.',
      selector: '#scanner',
      actionGuide: 'Bagian ini adalah checkpoint utama untuk menguji keaslian data atau pesan yang mencurigakan.',
      attentionGuide: 'JagaWarga menjunjung privasi: data sensitif disamarkan dan berkas hanya dihitung kode hash-nya di browser Anda tanpa diunggah.',
      points: [
        'Tanpa perlu daftar akun atau login.',
        '100% gratis dan data pribadi tidak disimpan di server publik.',
        'Menggunakan intelijen reputasi global & lokal Indonesia.',
      ],
    },
    {
      id: 'intake-modes',
      badge: 'Langkah 2 dari 5 · Jenis Pemeriksaan',
      title: 'Pilih Format yang Anda Hadapi',
      subtitle: '4 Mode pintar untuk berbagai jenis ancaman.',
      selector: '.intake-tabs',
      actionGuide: 'Klik salah satu dari 4 tab di atas sesuai yang Anda terima:',
      attentionGuide: 'Jika Anda langsung menempelkan teks atau tautan, sistem akan otomatis mengenali jenisnya.',
      points: [
        'Tautan / IoC: Cek alamat website, domain, IP publik, atau hash SHA-256.',
        'Teks Pesan: Analisis isi pesan WhatsApp, SMS penipuan hadiah, atau tagihan palsu.',
        'Berkas / APK: Uji kecurigaan file APK undangan atau dokumen tanpa menginstalnya di HP.',
        'Kode QR: Pindai isi link di dalam QR code secara aman tanpa langsung membukanya di browser.',
      ],
    },
    {
      id: 'input-field',
      badge: 'Langkah 3 dari 5 · Kolom Input & Bantuan',
      title: 'Tempel Data atau Coba Simulasi',
      subtitle: 'Memasukkan target pemeriksaan dengan cepat.',
      selector: '#indicator',
      actionGuide: 'Ketik atau tempel indikator di kolom input ini.',
      attentionGuide: 'Gunakan tombol bantuan di bawah kolom input untuk kemudahan:',
      points: [
        'Tombol “Tempel”: Membaca teks dari clipboard secara instan.',
        'Tombol “Coba contoh”: Muat contoh data uji coba aman untuk melihat alur kerja sistem.',
      ],
      interactiveDemo: {
        label: 'Isi Contoh Tautan Sekarang',
        description: 'Klik untuk mengisi contoh tautan simulasi ke kolom periksa.',
      },
    },
    {
      id: 'actions-verdict',
      badge: 'Langkah 4 dari 5 · Hasil & Mitigasi',
      title: 'Eksekusi & Pahami Hasil Pemeriksaan',
      subtitle: 'Hasil cepat dengan panduan langkah nyata.',
      selector: '.scanner-actions',
      actionGuide: 'Klik tombol “Periksa sekarang” untuk memulai pemindaian multi-sumber.',
      attentionGuide: 'Perhatikan 3 tingkatan status yang akan muncul pada halaman hasil:',
      points: [
        'Bebas Indikasi (Hijau): Tidak ditemukan sinyal ancaman pada database terpercaya.',
        'Waspada (Kuning): Ada kejanggalan atau bukti belum konklusif, tetap waspada.',
        'Berbahaya (Merah): Terindikasi phishing, malware, atau penipuan aktif. Disertai langkah darurat yang harus diambil.',
      ],
    },
    {
      id: 'features-and-ai',
      badge: 'Langkah 5 dari 5 · Fitur Lengkap & AI',
      title: 'Edukasi, Darurat, & AI Asisten JagaWarga',
      subtitle: 'Pendamping lengkap keamanan siber Anda.',
      selector: '.site-nav',
      actionGuide: 'Manfaatkan seluruh fitur di baris navigasi dan pojok kanan bawah:',
      attentionGuide: 'Jangan panik jika sudah terlanjur mentransfer uang atau membagikan data!',
      points: [
        'Tombol Darurat (Merah): Buka segera untuk panduan pemblokiran rekening & pelaporan resmi (OJK, Komdigi, Patroli Siber).',
        'Edukasi & Alat Bantu: Modus penipuan terkini, unshorten link pendek, dan cek email header.',
        'AI Asisten (Pojok Kanan Bawah): Tanya jawab real-time dengan AI yang memahami halaman yang sedang Anda buka.',
      ],
    },
  ];

  // Update position of spotlight box based on current selector
  const updateSpotlight = useCallback(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    const currentSelector = steps[currentStep]?.selector;
    if (!currentSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(currentSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  // Scroll target element into view once when step changes if not already visible
  useEffect(() => {
    if (!isOpen) return;
    const currentSelector = steps[currentStep]?.selector;
    if (currentSelector) {
      const el = document.querySelector(currentSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
          el.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, { passive: true });
    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [updateSpotlight]);

  // Check if first-time user
  useEffect(() => {
    try {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY);
      const dismissed = sessionStorage.getItem(TOUR_BANNER_DISMISSED_KEY);
      if (!completed && !dismissed && pathname === '/') {
        // Show gentle prompt banner after a brief 1s pause
        const timer = setTimeout(() => setShowPromptBanner(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage may fail in strict private mode
    }
  }, [pathname]);

  // Check URL param ?tour=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tour') === '1') {
        setCurrentStep(0);
        setIsOpen(true);
        setShowPromptBanner(false);
        // Clean URL without refresh
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Listen to custom start tour events
  useEffect(() => {
    const handleStart = () => {
      if (pathname !== '/') {
        router.push('/?tour=1');
      } else {
        setCurrentStep(0);
        setIsOpen(true);
        setShowPromptBanner(false);
      }
    };

    window.addEventListener('jagawarga:start-tour', handleStart);
    return () => window.removeEventListener('jagawarga:start-tour', handleStart);
  }, [pathname, router]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTour();
      } else if (e.key === 'ArrowRight') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  function startTour() {
    if (pathname !== '/') {
      router.push('/?tour=1');
    } else {
      setCurrentStep(0);
      setIsOpen(true);
      setShowPromptBanner(false);
      window.setTimeout(() => updateSpotlight(), 100);
    }
  }

  function dismissBanner() {
    setShowPromptBanner(false);
    try {
      sessionStorage.setItem(TOUR_BANNER_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  }

  function closeTour() {
    setIsOpen(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      closeTour();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  function loadInteractiveExample() {
    const inputEl = document.getElementById('indicator') as HTMLInputElement | HTMLTextAreaElement | null;
    if (inputEl) {
      inputEl.value = 'https://login-security.example/verify-account';
      // dispatch input event so React state syncs
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.focus();
    }
  }

  const step = steps[currentStep];

  return (
    <>
      {/* 1. First-time Visitor Gentle Welcome Banner */}
      {showPromptBanner && !isOpen && (
        <aside
          className="orientation-prompt-banner"
          role="region"
          aria-label="Panduan Orientasi JagaWarga"
        >
          <div className="prompt-banner-content">
            <span className="prompt-banner-icon" aria-hidden="true">
              <Icon name="compass" size={24} />
            </span>
            <div className="prompt-banner-text">
              <strong>Baru pertama kali di JagaWarga?</strong>
              <p>Ikuti tur orientasi singkat 1 menit untuk mengetahui bagian penting dan cara melakukan pemeriksaan digital.</p>
            </div>
          </div>
          <div className="prompt-banner-actions">
            <button
              type="button"
              className="prompt-btn-primary"
              onClick={startTour}
            >
              <Icon name="spark" size={16} />
              <span>Mulai Orientasi</span>
            </button>
            <button
              type="button"
              className="prompt-btn-secondary"
              onClick={dismissBanner}
              aria-label="Tutup saran orientasi"
            >
              Nanti Saja
            </button>
          </div>
        </aside>
      )}

      {/* 2. Interactive Spotlight Tour Modal */}
      {isOpen && (
        <div
          className="orientation-tour-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-step-title"
          aria-describedby="tour-step-desc"
        >
          {/* Spotlight Highlight Ring over Target Element */}
          {targetRect && (
            <div
              className="orientation-spotlight-box"
              style={{
                top: Math.max(0, targetRect.top - 8),
                left: Math.max(0, targetRect.left - 8),
                width: targetRect.width + 16,
                height: targetRect.height + 16,
              }}
              aria-hidden="true"
            />
          )}

          {/* Tour Explanation Card */}
          <div
            ref={cardRef}
            className="orientation-tour-card"
          >
            {/* Header */}
            <div className="tour-card-header">
              <div className="tour-badge-group">
                <span className="tour-step-badge">{step.badge}</span>
                <span className="tour-step-pill">
                  {currentStep + 1} / {steps.length}
                </span>
              </div>
              <button
                type="button"
                className="tour-close-btn"
                onClick={closeTour}
                aria-label="Tutup panduan orientasi"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="tour-card-body">
              <h2 id="tour-step-title">{step.title}</h2>
              <p id="tour-step-desc" className="tour-subtitle">{step.subtitle}</p>

              {/* Action & Attention Focus Boxes */}
              <div className="tour-guide-sections">
                <div className="tour-guide-box guide-action">
                  <div className="guide-box-header">
                    <Icon name="arrow" size={16} />
                    <strong>Yang Harus Dilakukan / Diklik:</strong>
                  </div>
                  <p>{step.actionGuide}</p>
                </div>

                <div className="tour-guide-box guide-attention">
                  <div className="guide-box-header">
                    <Icon name="shield" size={16} />
                    <strong>Yang Harus Diperhatikan:</strong>
                  </div>
                  <p>{step.attentionGuide}</p>
                </div>
              </div>

              {/* Point Highlights */}
              <ul className="tour-points-list">
                {step.points.map((point, index) => (
                  <li key={index}>
                    <span className="tour-bullet" aria-hidden="true">●</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {/* Interactive Demo Action if applicable */}
              {step.interactiveDemo && (
                <div className="tour-interactive-row">
                  <button
                    type="button"
                    className="tour-demo-btn"
                    onClick={loadInteractiveExample}
                  >
                    <Icon name="spark" size={16} />
                    <span>{step.interactiveDemo.label}</span>
                  </button>
                  <span className="tour-demo-hint">{step.interactiveDemo.description}</span>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="tour-card-footer">
              <button
                type="button"
                className="tour-nav-btn tour-skip-btn"
                onClick={closeTour}
              >
                Selesai & Lewati
              </button>

              <div className="tour-nav-group">
                <button
                  type="button"
                  className="tour-nav-btn tour-prev-btn"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  aria-label="Langkah sebelumnya"
                >
                  ← Kembali
                </button>
                <button
                  type="button"
                  className="tour-nav-btn tour-next-btn"
                  onClick={nextStep}
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <span>Selesai</span>
                      <Icon name="check" size={16} />
                    </>
                  ) : (
                    <>
                      <span>Lanjut</span>
                      <Icon name="arrow" size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function TourTriggerButton({
  className = '',
  label = 'Panduan',
}: {
  className?: string;
  label?: string;
}) {
  function trigger() {
    window.dispatchEvent(new CustomEvent('jagawarga:start-tour'));
  }

  return (
    <button
      type="button"
      className={className || 'nav-tour-btn'}
      onClick={trigger}
      aria-label="Mulai tur panduan orientasi JagaWarga"
      title="Buka panduan orientasi JagaWarga"
    >
      <Icon name="compass" size={16} />
      <span>{label}</span>
    </button>
  );
}
