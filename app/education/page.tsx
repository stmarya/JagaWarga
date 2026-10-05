'use client';

import { useEffect, useState } from 'react';
import { addXp } from '@/lib/client/storage';
import { Icon, type IconName } from '@/components/icon';

type Lesson = { title: string; summary: string; safe: string; risky: string };
type Question = { prompt: string; options: string[]; answer: number; explanation: string };
type LearningLevel = 'beginner' | 'intermediate' | 'advanced';
type TopicSummary = { slug: string; title: string; description: string; badge: string; level: LearningLevel; lessonCount: number; questionCount: number };
type Topic = TopicSummary & { lessons: Lesson[]; questions: Question[] };

const topicIcons: Record<string, IconName> = {
  phishing: 'alert', password: 'key', mfa: 'shield', device: 'device', network: 'network',
  privacy: 'privacy', malware: 'file', transaction: 'transaction', work: 'work', 'ai-misinformation': 'spark',
  'safe-chat': 'message', 'incident-response': 'alert',
};

export default function EducationPage() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [topicError, setTopicError] = useState('');
  const [lessonIndex, setLessonIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [level, setLevel] = useState<LearningLevel>('beginner');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jagawarga:education-completed') ?? '[]');
      if (Array.isArray(saved)) setCompleted(saved.filter((item): item is string => typeof item === 'string'));
    } catch {
      // Progress is optional; the catalog remains usable if storage is unavailable.
    }
  }, []);

  useEffect(() => {
    fetch('/api/education')
      .then((response) => {
        if (!response.ok) throw new Error('LOAD_FAILED');
        return response.json();
      })
      .then(setTopics)
      .catch(() => setLoadError('Materi belum dapat dimuat. Periksa koneksi lalu coba lagi.'))
      .finally(() => setLoading(false));
  }, []);

  async function selectTopic(summary: TopicSummary) {
    setLoading(true);
    setTopicError('');
    setTopic(null);
    try {
      const response = await fetch(`/api/education?slug=${encodeURIComponent(summary.slug)}`);
      if (!response.ok) throw new Error('TOPIC_LOAD_FAILED');
      setTopic(await response.json());
      setLessonIndex(0);
      setQuizIndex(null);
      setAnswer(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setTopicError('Materi ini belum dapat dimuat. Periksa koneksi lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  function answerQuestion(choice: number) {
    if (answer !== null || quizIndex === null || !topic) return;
    setAnswer(choice);
    if (choice === topic.questions[quizIndex].answer) setScore((value) => value + 1);
  }

  function nextQuestion() {
    if (quizIndex === null || !topic) return;
    if (quizIndex < topic.questions.length - 1) {
      setQuizIndex(quizIndex + 1);
      setAnswer(null);
      return;
    }
    if (!completed.includes(topic.slug)) {
      const nextCompleted = [...completed, topic.slug];
      setCompleted(nextCompleted);
      localStorage.setItem('jagawarga:education-completed', JSON.stringify(nextCompleted));
      addXp(50);
    }
    setQuizIndex(topic.questions.length);
  }

  if (loading && !topic && !topics.length) return <main className="compact-page"><div className="empty-card" role="status"><p>Memuat materi…</p></div></main>;

  if (loadError && !topics.length) return <main className="compact-page"><div className="empty-card" role="alert"><h1>Materi belum tersedia</h1><p>{loadError}</p><button type="button" className="primary-action" onClick={() => window.location.reload()}>Coba lagi</button></div></main>;

  if (topicError && !topic) return <main className="compact-page"><div className="empty-card" role="alert"><h1>Materi belum dapat dibuka</h1><p>{topicError}</p><button type="button" className="primary-action" onClick={() => window.location.reload()}>Coba lagi</button></div></main>;

  if (topic && quizIndex !== null) {
    if (quizIndex >= topic.questions.length) return (
      <main className="compact-page">
        <section className="certificate-card">
          <Icon name="shield" size={64} /><p>SERTIFIKAT PENYELESAIAN</p><h1>{topic.title}</h1>
          <p>Anda menyelesaikan {topic.lessons.length} submateri dan {topic.questions.length} evaluasi dengan skor <strong>{score}/{topic.questions.length}</strong>.</p>
          <div className="badge-earned">{topic.badge}</div>
          <button type="button" onClick={() => window.print()}>Cetak sertifikat</button>
          <button type="button" className="secondary-action" onClick={() => { setTopic(null); setQuizIndex(null); }}>Kembali ke semua topik</button>
        </section>
      </main>
    );
    const question = topic.questions[quizIndex];
    return (
      <main className="compact-page learning-page">
        <button type="button" className="back-button" onClick={() => setQuizIndex(null)}>← Kembali ke materi</button>
        <div className="quiz-progress"><span>Evaluasi {quizIndex + 1}/{topic.questions.length}</span><span>Skor {score}</span></div>
        <section className="quiz-card">
          <p className="kicker">{topic.title}</p><h1>{question.prompt}</h1>
          <div className="quiz-options">{question.options.map((option, index) => <button type="button" className={answer === null ? '' : index === question.answer ? 'correct' : answer === index ? 'incorrect' : ''} onClick={() => answerQuestion(index)} key={option}>{option}</button>)}</div>
          {answer !== null && <div className="quiz-explanation" role="status"><strong>{answer === question.answer ? 'Benar.' : 'Belum tepat.'}</strong> {question.explanation}</div>}
          {answer !== null && <button type="button" className="primary-action" onClick={nextQuestion}>{quizIndex === topic.questions.length - 1 ? 'Lihat hasil' : 'Pertanyaan berikutnya →'}</button>}
        </section>
      </main>
    );
  }

  if (topic) {
    const lesson = topic.lessons[lessonIndex];
    return (
      <main className="compact-page learning-page">
        <button type="button" className="back-button" onClick={() => setTopic(null)}>← Semua topik</button>
        <header className="lesson-header"><span className="topic-icon professional-icon"><Icon name={topicIcons[topic.slug]} size={34} /></span><div><p className="kicker">MODUL KEAMANAN DIGITAL</p><h1>{topic.title}</h1><p>{topic.description}</p></div></header>
        <div className="lesson-layout">
          <nav className="lesson-nav" aria-label="Submateri">{topic.lessons.map((item, index) => <button type="button" aria-pressed={index === lessonIndex} className={index === lessonIndex ? 'active' : ''} onClick={() => setLessonIndex(index)} key={item.title}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}</button>)}</nav>
          <article className="lesson-card">
            <p className="step-label">SUBMATERI {lessonIndex + 1} DARI {topic.lessons.length}</p><h2>{lesson.title}</h2><p>{lesson.summary}</p>
            <div className="do-dont"><div><strong><Icon name="check" /> LAKUKAN</strong><p>{lesson.safe}</p></div><div><strong><Icon name="close" /> HINDARI</strong><p>{lesson.risky}</p></div></div>
            <div className="lesson-actions"><button type="button" className="secondary-action" disabled={lessonIndex === 0} onClick={() => setLessonIndex(lessonIndex - 1)}>Sebelumnya</button>{lessonIndex < topic.lessons.length - 1 ? <button type="button" onClick={() => setLessonIndex(lessonIndex + 1)}>Berikutnya →</button> : <button type="button" onClick={() => { setQuizIndex(0); setScore(0); setAnswer(null); }}>Mulai evaluasi →</button>}</div>
          </article>
        </div>
      </main>
    );
  }

  const visibleTopics = topics.filter((item) => item.level === level);
  const topicCountByLevel = (target: LearningLevel) => topics.filter((item) => item.level === target).length;

  return (
    <main className="compact-page education-page">
      <header className="page-heading"><div><p className="kicker">BELAJAR KEAMANAN DIGITAL</p><h1>Kenali penipuan sebelum menjadi korbannya.</h1><p>Mulai dari contoh sehari-hari, pelajari tanda-tandanya, lalu uji pemahaman Anda.</p></div><div className="progress-orb"><strong>{completed.length}</strong><span>/{topics.length} selesai</span></div></header>
      <nav className="level-tabs" role="tablist" aria-label="Pilih tingkat belajar">
        <button type="button" role="tab" aria-selected={level === 'beginner'} aria-pressed={level === 'beginner'} className={level === 'beginner' ? 'active' : ''} onClick={() => setLevel('beginner')}><strong>Dasar</strong><span>{topicCountByLevel('beginner')} materi · Baru mulai belajar</span></button>
        <button type="button" role="tab" aria-selected={level === 'intermediate'} aria-pressed={level === 'intermediate'} className={level === 'intermediate' ? 'active' : ''} onClick={() => setLevel('intermediate')}><strong>Menengah</strong><span>{topicCountByLevel('intermediate')} materi · Sudah paham dasar</span></button>
        <button type="button" role="tab" aria-selected={level === 'advanced'} aria-pressed={level === 'advanced'} className={level === 'advanced' ? 'active' : ''} onClick={() => setLevel('advanced')}><strong>Lanjutan</strong><span>{topicCountByLevel('advanced')} materi · Untuk pengelola dan tim</span></button>
      </nav>
      <div className="level-intro"><strong>{level === 'beginner' ? 'Mulai di sini' : level === 'intermediate' ? 'Perkuat kebiasaan Anda' : 'Siapkan perlindungan yang lebih matang'}</strong><p>{level === 'beginner' ? 'Tidak perlu memahami istilah teknis. Ikuti contoh dan pilih tindakan yang paling aman.' : level === 'intermediate' ? 'Pelajari pengaturan akun, jaringan, privasi, dan berkas mencurigakan.' : 'Pelajari perlindungan organisasi, informasi palsu, dan penanganan insiden.'}</p></div>
      <section className="topic-grid" aria-label="Daftar materi">{visibleTopics.length ? visibleTopics.map((item, index) => <button type="button" className="topic-card" onClick={() => selectTopic(item)} key={item.slug} aria-label={`Buka materi ${item.title}`}><span className="topic-icon professional-icon"><Icon name={topicIcons[item.slug] ?? 'book'} size={26} /></span><span className="topic-number">MATERI {String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><p>{item.description}</p><small>{item.lessonCount} pelajaran singkat · {item.questionCount} latihan</small>{completed.includes(item.slug) && <b><Icon name="check" /> {item.badge}</b>}</button>) : <div className="empty-card"><h2>Belum ada materi di level ini</h2><p>Pilih level lain untuk melihat materi yang tersedia.</p></div>}</section>
    </main>
  );
}
