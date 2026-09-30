'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ScanResultContext = {
  indicator?: { type: string; displayValue: string };
  risk?: number;
  verdict?: string;
  checkedAt?: string;
  confidence?: string;
};

export function AiAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya **Asisten Siaga JagaWarga**. Saya memantau halaman Anda secara langsung dan siap membantu menganalisis indikator mencurigakan atau memberikan panduan darurat.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResultContext | null>(null);
  const [poweredBy, setPoweredBy] = useState<string>('Groq AI');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync sessionStorage for recent scan results
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('jagawarga:last-result');
      if (stored) {
        setLastResult(JSON.parse(stored));
      }
    } catch {
      // sessionStorage might not be available or JSON is invalid
    }
  }, [pathname, isOpen]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Context-specific quick chips
  const getQuickChips = () => {
    if (pathname?.includes('/details') && lastResult) {
      return [
        `Jelaskan risiko indikator ${lastResult.indicator?.displayValue || ''}`,
        'Apakah tautan/domain ini aman diklik?',
        'Saya sudah terlanjur membuka tautan ini, apa yang harus dilakukan?',
      ];
    }
    if (pathname?.includes('/emergency')) {
      return [
        'Saya terlanjur transfer uang ke penipu!',
        'Bagaimana cara blokir rekening penipu via CekRekening.id?',
        'Nomor call center resmi bank di Indonesia',
      ];
    }
    if (pathname?.includes('/tools')) {
      return [
        'Kapan saya harus menggunakan Pemeriksa Tautan Singkat?',
        'Bagaimana cara membaca SPF & DKIM pada header email?',
        'Apakah aman menghitung hash berkas di sini?',
      ];
    }
    if (pathname?.includes('/education')) {
      return [
        'Apa tanda utama file APK yang menyamar jadi undangan/tilang?',
        'Bagaimana modus penipuan QRIS quishing bekerja?',
        'Apa tips membuat kata sandi yang kuat tapi mudah diingat?',
      ];
    }
    return [
      'Ciri-ciri pesan penipuan WhatsApp yang sedang marak',
      'Saya baru saja ditelepon orang mengaku dari bank',
      'Bagaimana cara cek keaslian link sebelum diklik?',
    ];
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            pathname,
            lastResult,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        if (data.poweredBy) setPoweredBy(data.poweredBy);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Maaf, terjadi kendala saat memproses jawaban. Silakan coba kembali sesaat lagi.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Koneksi terputus. Pastikan perangkat Anda terhubung ke internet.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const pageLabel = () => {
    if (pathname === '/') return 'Beranda / Pemindai';
    if (pathname?.startsWith('/details')) return 'Detail Teknis IOC';
    if (pathname?.startsWith('/education')) return 'Modul Edukasi';
    if (pathname?.startsWith('/tools')) return 'Alat Bantu Keamanan';
    if (pathname?.startsWith('/emergency')) return 'Pusat Darurat Siber';
    return pathname;
  };

  return (
    <aside className="ai-assistant-wrapper no-print" aria-label="Asisten Keamanan Siber">
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          type="button"
          className="ai-fab-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Buka Asisten Siaga JagaWarga"
        >
          <span className="ai-fab-pulse" />
          <Icon name="spark" size={20} />
          <span className="ai-fab-text">Tanya AI Asisten</span>
        </button>
      )}

      {/* Chat modal / flyout */}
      {isOpen && (
        <div className="ai-chat-window" role="dialog" aria-modal="true" aria-labelledby="ai-chat-title">
          <header className="ai-chat-header">
            <div className="ai-chat-title-group">
              <span className="ai-chat-avatar">
                <Icon name="spark" size={18} />
              </span>
              <div>
                <strong id="ai-chat-title">Asisten Siaga</strong>
                <span className="ai-status-indicator">
                  <i className="ai-status-dot" /> Siaga Real-time ({poweredBy})
                </span>
              </div>
            </div>
            <button
              type="button"
              className="ai-chat-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup jendela asisten"
            >
              <Icon name="close" size={18} />
            </button>
          </header>

          {/* Realtime Context Bar */}
          <div className="ai-context-banner">
            <span className="ai-context-pill">
              📍 <strong>{pageLabel()}</strong>
            </span>
            {lastResult && (
              <span className={`ai-context-ioc ${lastResult.risk && lastResult.risk >= 60 ? 'risky' : 'safe'}`}>
                IOC: {lastResult.indicator?.displayValue?.slice(0, 24)} ({lastResult.risk}/100)
              </span>
            )}
          </div>

          {/* Messages list */}
          <div className="ai-messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`ai-message-row ai-message-${msg.role}`}>
                {msg.role === 'assistant' && (
                  <span className="ai-msg-avatar">
                    <Icon name="spark" size={14} />
                  </span>
                )}
                <div className="ai-msg-bubble">
                  {msg.content.split('\n').map((line, i) => {
                    if (!line.trim()) return <br key={i} />;
                    return (
                      <p key={i}>
                        {line.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-message-row ai-message-assistant">
                <span className="ai-msg-avatar">
                  <Icon name="spark" size={14} />
                </span>
                <div className="ai-msg-bubble ai-loading-bubble">
                  <span className="ai-dot-pulse" />
                  <span className="ai-dot-pulse" />
                  <span className="ai-dot-pulse" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick action chips */}
          <div className="ai-quick-chips">
            {getQuickChips().map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="ai-chip-btn"
                onClick={() => handleSend(chip)}
                disabled={loading}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form
            className="ai-chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              className="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pertanyaan atau keluhan siber..."
              disabled={loading}
            />
            <button
              type="submit"
              className="ai-chat-send-btn"
              disabled={!input.trim() || loading}
              aria-label="Kirim pesan"
            >
              <Icon name="arrow" size={16} />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
