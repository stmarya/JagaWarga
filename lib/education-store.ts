import { educationTopics, topicQuestions, type Topic } from './education';
import { runtimeRedis } from './runtime/redis';

const KEY = 'jagawarga:education-catalog:v2';

export type EducationTopicDetail = Topic & {
  questions: ReturnType<typeof topicQuestions>;
  level: 'beginner' | 'intermediate' | 'advanced';
};

const levels: Record<string, EducationTopicDetail['level']> = {
  phishing: 'beginner', password: 'beginner', device: 'beginner', transaction: 'beginner', 'safe-chat': 'beginner',
  mfa: 'intermediate', network: 'intermediate', privacy: 'intermediate', malware: 'intermediate',
  work: 'advanced', 'ai-misinformation': 'advanced', 'incident-response': 'advanced',
};

function detail(topic: Topic): EducationTopicDetail {
  return { ...topic, level: levels[topic.slug] ?? 'beginner', questions: topicQuestions(topic) };
}

export async function listEducationTopics() {
  return educationTopics.map(({ lessons, ...topic }) => ({
    ...topic,
    level: levels[topic.slug] ?? 'beginner',
    lessonCount: lessons.length,
    questionCount: topicQuestions({ ...topic, lessons }).length,
  }));
}

export async function getEducationTopic(slug: string) {
  const redis = await runtimeRedis();
  if (redis) {
    const cached = await redis.hGet(KEY, slug);
    if (cached) return JSON.parse(cached) as EducationTopicDetail;
  }
  const topic = educationTopics.find((item) => item.slug === slug);
  if (!topic) return null;
  const value = detail(topic);
  if (redis) await redis.hSet(KEY, slug, JSON.stringify(value));
  return value;
}