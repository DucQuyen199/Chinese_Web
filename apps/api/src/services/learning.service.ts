import { prisma } from '../lib/prisma.js';
import { pagination } from '../utils/http.js';

export async function getDashboard(userId: string) {
  const [user, activeCourse, streak, vocabularyCount, learnedCount, experience, recentLessons, achievements, dueReviews] = await prisma.$transaction([
    prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
    prisma.userCourseProgress.findFirst({ where: { userId, status: { not: 'COMPLETED' } }, orderBy: { updatedAt: 'desc' }, include: { course: { include: { level: true, modules: { include: { lessons: { orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, durationMinutes: true, sortOrder: true } } } } } } } }),
    prisma.userStreak.findUnique({ where: { userId } }),
    prisma.userVocabularyProgress.count({ where: { userId } }),
    prisma.userVocabularyProgress.count({ where: { userId, status: 'KNOWN' } }),
    prisma.experienceLog.aggregate({ where: { userId }, _sum: { amount: true } }),
    prisma.userLessonProgress.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 4, include: { lesson: { include: { module: { include: { course: { select: { title: true, coverColor: true, slug: true } } } } } } } }),
    prisma.userAchievement.findMany({ where: { userId }, orderBy: { unlockedAt: 'desc' }, take: 4, include: { achievement: true } }),
    prisma.userVocabularyProgress.count({ where: { userId, nextReviewAt: { lte: new Date() } } }),
  ]);
  const xp = experience._sum.amount ?? 0;
  const firstLesson = activeCourse?.course.modules[0]?.lessons[0] ?? null;
  return {
    user: user ? { id: user.id, name: user.name, profile: user.profile } : null,
    stats: { xp, level: getLevel(xp), vocabularyCount, learnedCount, dueReviews, totalMinutes: user?.profile?.totalMinutes ?? 0 },
    streak: streak ?? { currentStreak: 0, longestStreak: 0 },
    dailyGoal: { target: user?.profile?.dailyTarget ?? 15, completed: Math.min(user?.profile?.totalMinutes ?? 0, user?.profile?.dailyTarget ?? 15) },
    continueLearning: activeCourse ? { course: activeCourse.course, progress: activeCourse.progressPct, nextLesson: firstLesson } : null,
    recentLessons,
    achievements,
  };
}

export async function listVocabulary(input: { page: number; limit: number; search?: string; hsk?: string; userId?: string }) {
  const where = {
    language: 'zh-CN',
    ...(input.search ? { OR: [{ simplified: { contains: input.search, mode: 'insensitive' as const } }, { pinyin: { contains: input.search, mode: 'insensitive' as const } }, { meaningVi: { contains: input.search, mode: 'insensitive' as const } }] } : {}),
    ...(input.hsk ? { hskLevel: input.hsk } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.vocabulary.findMany({ where, orderBy: { simplified: 'asc' }, skip: (input.page - 1) * input.limit, take: input.limit, include: { progress: input.userId ? { where: { userId: input.userId } } : false } }),
    prisma.vocabulary.count({ where }),
  ]);
  return { items, pagination: pagination(input.page, input.limit, total) };
}

export async function listDueReviews(userId: string) {
  return prisma.userVocabularyProgress.findMany({ where: { userId, nextReviewAt: { lte: new Date() } }, orderBy: { nextReviewAt: 'asc' }, take: 20, include: { vocabulary: true } });
}

export async function reviewVocabulary(userId: string, vocabularyId: string, rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') {
  const current = await prisma.userVocabularyProgress.findUnique({ where: { userId_vocabularyId: { userId, vocabularyId } } });
  const intervals = { AGAIN: 0, HARD: Math.max(1, (current?.interval ?? 1) + 1), GOOD: Math.max(2, (current?.interval ?? 1) * 2), EASY: Math.max(4, (current?.interval ?? 1) * 3) };
  const interval = intervals[rating];
  const status = rating === 'EASY' || rating === 'GOOD' ? 'KNOWN' : 'LEARNING';
  return prisma.userVocabularyProgress.upsert({ where: { userId_vocabularyId: { userId, vocabularyId } }, update: { status, interval, reviewCount: { increment: 1 }, lastReviewedAt: new Date(), nextReviewAt: new Date(Date.now() + interval * 24 * 60 * 60 * 1000), easeFactor: { increment: rating === 'EASY' ? 0.1 : rating === 'AGAIN' ? -0.2 : 0 } }, create: { userId, vocabularyId, status, interval, reviewCount: 1, lastReviewedAt: new Date(), nextReviewAt: new Date(Date.now() + interval * 24 * 60 * 60 * 1000) } });
}

export async function getStatistics(userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const [profile, courseProgress, lessonProgress, vocabulary, activity] = await prisma.$transaction([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.userCourseProgress.findMany({ where: { userId }, include: { course: { select: { title: true, coverColor: true } } } }),
    prisma.userLessonProgress.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.userVocabularyProgress.count({ where: { userId } }),
    prisma.experienceLog.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: 'asc' } }),
  ]);
  const activityMap = new Map<string, number>();
  for (const log of activity) {
    const day = log.createdAt.toISOString().slice(0, 10);
    activityMap.set(day, (activityMap.get(day) ?? 0) + 5);
  }
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const key = day.toISOString().slice(0, 10);
    return { date: key, minutes: activityMap.get(key) ?? 0 };
  });
  return { totals: { totalMinutes: profile?.totalMinutes ?? 0, completedLessons: lessonProgress, vocabulary, activeCourses: courseProgress.length }, weeklyActivity, skillScores: [{ skill: 'Nghe', score: 82 }, { skill: 'Nói', score: 74 }, { skill: 'Đọc', score: 90 }, { skill: 'Viết', score: 70 }], courseProgress };
}

export async function getLeaderboard() {
  const users = await prisma.user.findMany({ where: { status: 'ACTIVE' }, take: 20, orderBy: { experienceLogs: { _count: 'desc' } }, include: { experienceLogs: { select: { amount: true } }, profile: { select: { currentLevel: true } } } });
  return users.map((user, index) => ({ rank: index + 1, name: user.name, level: user.profile?.currentLevel ?? 'HSK 1', xp: user.experienceLogs.reduce((sum, item) => sum + item.amount, 0) })).sort((a, b) => b.xp - a.xp).map((user, index) => ({ ...user, rank: index + 1 }));
}

export function getLevel(xp: number) {
  if (xp >= 5000) return { number: 5, label: 'Master' };
  if (xp >= 3000) return { number: 4, label: 'Scholar' };
  if (xp >= 1500) return { number: 3, label: 'Learner' };
  if (xp >= 500) return { number: 2, label: 'Explorer' };
  return { number: 1, label: 'Beginner' };
}
