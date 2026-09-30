import { educationTopics } from '../education';
import type { AiSource } from './types';

export const VERIFIED_SOURCES = {
  aduanKonten: {
    label: 'Aduan Konten Komdigi',
    url: 'https://aduankonten.id/',
    verifiedAt: '2026-09-30',
  },
  patroliSiber: {
    label: 'Patroli Siber Polri',
    url: 'https://patrolisiber.id/',
    verifiedAt: '2026-09-30',
  },
  iasc: {
    label: 'Indonesia Anti-Scam Centre OJK',
    url: 'https://iasc.ojk.go.id/',
    verifiedAt: '2026-09-30',
  },
  cekRekening: {
    label: 'Cek Rekening Komdigi',
    url: 'https://cekrekening.id/',
    verifiedAt: '2026-09-30',
  },
} satisfies Record<string, AiSource>;

export function officialSources(intent: string): AiSource[] {
  if (intent === 'emergency') return [VERIFIED_SOURCES.iasc, VERIFIED_SOURCES.patroliSiber, VERIFIED_SOURCES.cekRekening];
  if (intent === 'result') return [VERIFIED_SOURCES.aduanKonten, VERIFIED_SOURCES.patroliSiber];
  return [];
}

export function retrieveEducation(query: string, limit = 3) {
  const terms = query.toLowerCase().split(/\W+/).filter((term) => term.length > 3);
  return educationTopics
    .map((topic) => {
      const haystack = `${topic.title} ${topic.description} ${topic.lessons.map((lesson) => `${lesson.title} ${lesson.summary}`).join(' ')}`.toLowerCase();
      return { topic, score: terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ topic }) => ({
      slug: topic.slug,
      title: topic.title,
      description: topic.description,
      lessons: topic.lessons.slice(0, 2).map(({ title, summary, safe }) => ({ title, summary, safe })),
    }));
}