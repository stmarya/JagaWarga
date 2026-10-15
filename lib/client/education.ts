export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';
export type TopicSummary = { slug: string; title: string; description: string; badge: string; level: LearningLevel; lessonCount: number; questionCount: number };
export type Lesson = { title: string; summary: string; safe: string; risky: string };
export type Question = { prompt: string; options: string[]; answer: number; explanation: string };
export type LearningTopic = TopicSummary & { lessons: Lesson[]; questions: Question[] };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 12000;
function summary(v: unknown): v is TopicSummary {
 return object(v) && typeof v.slug === 'string' && /^[a-z0-9-]{1,80}$/.test(v.slug) && text(v.title) && text(v.description) && text(v.badge) && ['beginner','intermediate','advanced'].includes(String(v.level)) && Number.isInteger(v.lessonCount) && Number(v.lessonCount)>0 && Number(v.lessonCount)<=100 && Number.isInteger(v.questionCount) && Number(v.questionCount)>0 && Number(v.questionCount)<=100;
}
export function readCatalog(v: unknown): TopicSummary[] {
 if (!Array.isArray(v) || v.length>100 || !v.every(summary) || new Set(v.map(t=>t.slug)).size!==v.length) throw new Error('Katalog tidak valid. Coba muat ulang.');
 return v;
}
export function readLearningTopic(v: unknown, expectedSlug: string): LearningTopic {
 if (!object(v) || v.slug !== expectedSlug || !Array.isArray(v.lessons) || !v.lessons.length || v.lessons.length>100 || !Array.isArray(v.questions) || !v.questions.length || v.questions.length>100) throw new Error('Materi tidak valid. Pilih topik lain atau coba lagi.');
 const normalized={...v,lessonCount:v.lessons.length,questionCount:v.questions.length};
 if (!summary(normalized) || !v.lessons.every(l=>object(l)&&['title','summary','safe','risky'].every(k=>text(l[k]))) || !v.questions.every(q=>object(q)&&text(q.prompt)&&text(q.explanation)&&Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=8&&q.options.every(text)&&Number.isInteger(q.answer)&&Number(q.answer)>=0&&Number(q.answer)<q.options.length)) throw new Error('Materi tidak valid. Pilih topik lain atau coba lagi.');
 return normalized as LearningTopic;
}
