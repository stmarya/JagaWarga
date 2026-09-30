import { educationTopics, topicQuestions, type Topic } from './education';
import { runtimeRedis } from './runtime/redis';

const KEY = 'jagawarga:education-catalog:v1';

export type EducationTopicDetail = Topic & {
  questions: ReturnType<typeof topicQuestions>;
};

function detail(topic: Topic): EducationTopicDetail {
  return { ...topic, questions: topicQuestions(topic) };
}

export async function listEducationTopics() {
  return educationTopics.map(({ lessons, ...topic }) => ({
    ...topic,
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