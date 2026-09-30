'use client';

import { useEffect, useState } from 'react';
import { addXp } from '@/lib/client/storage';
import { Icon, type IconName } from '@/components/icon';

type Lesson = { title: string; summary: string; safe: string; risky: string };
type Question = { prompt: string; options: string[]; answer: number; explanation: string };
type TopicSummary = { slug: string; title: string; description: string; badge: string; lessonCount: number; questionCount: number };
type Topic = TopicSummary & { lessons: Lesson[]; questions: Question[] };

const topicIcons: Record<string, IconName> = {
  phishing: 'alert', password: 'key', mfa: 'shield', device: 'device', network: 'network',
  privacy: 'privacy', malware: 'file', transaction: 'transaction', work: 'work', 'ai-misinformation': 'spark',
};

export default function EducationPage() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/education').then((response) => response.json()).then(setTopics).finally(() => setLoading(false));
  }, []);

  async function selectTopic(summary: TopicSummary) {
    setLoading(true);
    const response = await fetch(`/api/education?slug=${encodeURIComponent(summary.slug)}`);
    if (response.ok) {
      setTopic(await response.json());
      setLessonIndex(0);
      setQuizIndex(null);
      setAnswer(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setLoading(false);
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
      setCompleted((items) => [...items, topic.slug]);
      addXp(50);
    }
    setQuizIndex(topic.questions.length);
  }

  if (loading && !topic && !topics.length) return <main className="compact-page"><div className="empty-card"><p>Memuat katalog edukasi…</p></div></main>;

  if (topic && quizIndex !== null) {
    if (quizIndex >= topic.questions.length) return (
      <main className="compact-page">
        <section className="certificate-card">
          <Icon name="shield" size={64} /><p>SERTIFIKAT PENYELESAIAN</p><h1>{topic.title}</h1>
          <p>Anda menyelesaikan {topic.lessons.length} submateri dan {topic.questions.length} evaluasi dengan skor <strong>{score}/{topic.questions.length}</strong>.</p>
          <div className="badge-earned">{topic.badge}</div>
          <button onClick={() => window.print()}>Cetak sertifikat</button>
          <button className="secondary-action" onClick={() => { setTopic(null); setQuizIndex(null); }}>Kembali ke semua topik</button>
        </section>
      </main>
    );
    const question = topic.questions[quizIndex];
    return (
      <main className="compact-page learning-page">
        <button className="back-button" onClick={() => setQuizIndex(null)}>← Kembali ke materi</button>
        <div className="quiz-progress"><span>Evaluasi {quizIndex + 1}/{topic.questions.length}</span><span>Skor {score}</span></div>
        <section className="quiz-card">
          <p className="kicker">{topic.title}</p><h1>{question.prompt}</h1>
          <div className="quiz-options">{question.options.map((option, index) => <button className={answer === null ? '' : index === question.answer ? 'correct' : answer === index ? 'incorrect' : ''} onClick={() => answerQuestion(index)} key={option}>{option}</button>)}</div>
          {answer !== null && <div className="quiz-explanation"><strong>{answer === question.answer ? 'Benar.' : 'Belum tepat.'}</strong> {question.explanation}</div>}
          {answer !== null && <button className="primary-action" onClick={nextQuestion}>{quizIndex === topic.questions.length - 1 ? 'Lihat hasil' : 'Pertanyaan berikutnya →'}</button>}
        </section>
      </main>
    );
  }

  if (topic) {
    const lesson = topic.lessons[lessonIndex];
    return (
      <main className="compact-page learning-page">
        <button className="back-button" onClick={() => setTopic(null)}>← Semua topik</button>
        <header className="lesson-header"><span className="topic-icon professional-icon"><Icon name={topicIcons[topic.slug]} size={34} /></span><div><p className="kicker">MODUL KEAMANAN DIGITAL</p><h1>{topic.title}</h1><p>{topic.description}</p></div></header>
        <div className="lesson-layout">
          <nav className="lesson-nav" aria-label="Submateri">{topic.lessons.map((item, index) => <button className={index === lessonIndex ? 'active' : ''} onClick={() => setLessonIndex(index)} key={item.title}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}</button>)}</nav>
          <article className="lesson-card">
            <p className="step-label">SUBMATERI {lessonIndex + 1} DARI {topic.lessons.length}</p><h2>{lesson.title}</h2><p>{lesson.summary}</p>
            <div className="do-dont"><div><strong><Icon name="check" /> LAKUKAN</strong><p>{lesson.safe}</p></div><div><strong><Icon name="close" /> HINDARI</strong><p>{lesson.risky}</p></div></div>
            <div className="lesson-actions"><button className="secondary-action" disabled={lessonIndex === 0} onClick={() => setLessonIndex(lessonIndex - 1)}>Sebelumnya</button>{lessonIndex < topic.lessons.length - 1 ? <button onClick={() => setLessonIndex(lessonIndex + 1)}>Berikutnya →</button> : <button onClick={() => { setQuizIndex(0); setScore(0); setAnswer(null); }}>Mulai evaluasi →</button>}</div>
          </article>
        </div>
      </main>
    );
  }

  return (
    <main className="compact-page education-page">
      <header className="page-heading"><div><p className="kicker">AKADEMI JAGA/WARGA</p><h1>Belajar mengambil keputusan yang aman.</h1><p>Materi dimuat per topik dari katalog backend agar tetap ringan di perangkat seluler.</p></div><div className="progress-orb"><strong>{completed.length}</strong><span>/{topics.length} selesai</span></div></header>
      <section className="topic-grid">{topics.map((item, index) => <button className="topic-card" onClick={() => selectTopic(item)} key={item.slug}><span className="topic-icon professional-icon"><Icon name={topicIcons[item.slug]} size={26} /></span><span className="topic-number">TOPIK {String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><p>{item.description}</p><small>{item.lessonCount} submateri · {item.questionCount} evaluasi</small>{completed.includes(item.slug) && <b><Icon name="check" /> {item.badge}</b>}</button>)}</section>
    </main>
  );
}