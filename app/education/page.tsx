'use client';

import { useMemo, useState } from 'react';
import { addXp } from '@/lib/client/storage';
import { educationTopics, topicQuestions } from '@/lib/education';

export default function EducationPage() {
  const [topicIndex, setTopicIndex] = useState<number | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const topic = topicIndex === null ? null : educationTopics[topicIndex];
  const questions = useMemo(() => topic ? topicQuestions(topic) : [], [topic]);

  function selectTopic(index: number) {
    setTopicIndex(index);
    setLessonIndex(0);
    setQuizIndex(null);
    setAnswer(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function answerQuestion(choice: number) {
    if (answer !== null || quizIndex === null) return;
    setAnswer(choice);
    if (choice === questions[quizIndex].answer) setScore((value) => value + 1);
  }

  function nextQuestion() {
    if (quizIndex === null) return;
    if (quizIndex < 9) {
      setQuizIndex(quizIndex + 1);
      setAnswer(null);
      return;
    }
    if (topic && !completed.includes(topic.slug)) {
      setCompleted((items) => [...items, topic.slug]);
      addXp(50);
    }
    setQuizIndex(10);
  }

  if (topic && quizIndex !== null) {
    if (quizIndex >= 10) return (
      <main className="compact-page">
        <section className="certificate-card">
          <span>🏅</span><p>SERTIFIKAT PENYELESAIAN</p><h1>{topic.title}</h1>
          <p>Anda menyelesaikan 5 submateri dan 10 evaluasi dengan skor <strong>{score}/10</strong>.</p>
          <div className="badge-earned">{topic.badge}</div>
          <button onClick={() => window.print()}>Cetak sertifikat</button>
          <button className="secondary-action" onClick={() => { setTopicIndex(null); setQuizIndex(null); }}>Kembali ke semua topik</button>
        </section>
      </main>
    );
    const question = questions[quizIndex];
    return (
      <main className="compact-page learning-page">
        <button className="back-button" onClick={() => setQuizIndex(null)}>← Kembali ke materi</button>
        <div className="quiz-progress"><span>Evaluasi {quizIndex + 1}/10</span><span>Skor {score}</span></div>
        <section className="quiz-card">
          <p className="kicker">{topic.title}</p><h1>{question.prompt}</h1>
          <div className="quiz-options">{question.options.map((option, index) => <button className={answer === null ? '' : index === question.answer ? 'correct' : answer === index ? 'incorrect' : ''} onClick={() => answerQuestion(index)} key={option}>{option}</button>)}</div>
          {answer !== null && <div className="quiz-explanation"><strong>{answer === question.answer ? 'Benar.' : 'Belum tepat.'}</strong> {question.explanation}</div>}
          {answer !== null && <button className="primary-action" onClick={nextQuestion}>{quizIndex === 9 ? 'Lihat hasil' : 'Pertanyaan berikutnya →'}</button>}
        </section>
      </main>
    );
  }

  if (topic) {
    const lesson = topic.lessons[lessonIndex];
    return (
      <main className="compact-page learning-page">
        <button className="back-button" onClick={() => setTopicIndex(null)}>← Semua topik</button>
        <header className="lesson-header"><span>{topic.icon}</span><div><p className="kicker">TOPIK {topicIndex! + 1}/10</p><h1>{topic.title}</h1><p>{topic.description}</p></div></header>
        <div className="lesson-layout">
          <nav className="lesson-nav" aria-label="Submateri">{topic.lessons.map((item, index) => <button className={index === lessonIndex ? 'active' : ''} onClick={() => setLessonIndex(index)} key={item.title}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}</button>)}</nav>
          <article className="lesson-card">
            <p className="step-label">SUBMATERI {lessonIndex + 1} DARI 5</p><h2>{lesson.title}</h2><p>{lesson.summary}</p>
            <div className="do-dont"><div><strong>✓ LAKUKAN</strong><p>{lesson.safe}</p></div><div><strong>× HINDARI</strong><p>{lesson.risky}</p></div></div>
            <div className="lesson-actions"><button className="secondary-action" disabled={lessonIndex === 0} onClick={() => setLessonIndex(lessonIndex - 1)}>Sebelumnya</button>{lessonIndex < 4 ? <button onClick={() => setLessonIndex(lessonIndex + 1)}>Berikutnya →</button> : <button onClick={() => { setQuizIndex(0); setScore(0); setAnswer(null); }}>Mulai 10 evaluasi →</button>}</div>
          </article>
        </div>
      </main>
    );
  }

  return (
    <main className="compact-page education-page">
      <header className="page-heading"><div><p className="kicker">AKADEMI JAGA/WARGA</p><h1>Belajar aman, satu langkah setiap hari.</h1><p>10 topik, 50 submateri, dan 100 evaluasi interaktif. Selesaikan topik untuk mendapat emblem dan sertifikat.</p></div><div className="progress-orb"><strong>{completed.length}</strong><span>/10 selesai</span></div></header>
      <section className="topic-grid">{educationTopics.map((item, index) => <button className="topic-card" onClick={() => selectTopic(index)} key={item.slug}><span className="topic-icon">{item.icon}</span><span className="topic-number">TOPIK {String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><p>{item.description}</p><small>5 submateri · 10 evaluasi</small>{completed.includes(item.slug) && <b>✓ {item.badge}</b>}</button>)}</section>
    </main>
  );
}