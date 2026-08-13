import { prisma } from '../lib/prisma.js';
import { HttpError, pagination } from '../utils/http.js';

export async function listCourses(input: { page: number; limit: number; search?: string; level?: string }) {
  const where = {
    status: 'PUBLISHED' as const,
    ...(input.search ? { OR: [{ title: { contains: input.search, mode: 'insensitive' as const } }, { summary: { contains: input.search, mode: 'insensitive' as const } }, { subtitle: { contains: input.search, mode: 'insensitive' as const } }, { description: { contains: input.search, mode: 'insensitive' as const } }] } : {}),
    ...(input.level ? { level: { code: input.level } } : {}),
  };
  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      include: { level: true, category: true, modules: { include: { lessons: { select: { id: true } } } } },
      orderBy: { createdAt: 'asc' },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.course.count({ where }),
  ]);
  return { items: courses.map((course) => ({ ...course, summary: course.summary || course.subtitle, lessonCount: course.modules.reduce((sum, module) => sum + module.lessons.length, 0), modules: undefined })), pagination: pagination(input.page, input.limit, total) };
}

export async function getCourseBySlug(slug: string, userId?: string) {
  const course = await prisma.course.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: { level: true, category: true, modules: { orderBy: { sortOrder: 'asc' }, include: { lessons: { orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, summary: true, durationMinutes: true, sortOrder: true } } } } },
  });
  if (!course) throw new HttpError(404, 'Không tìm thấy khóa học.');
  const progress = userId ? await prisma.userCourseProgress.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } }) : null;
  const lessonProgress = userId ? await prisma.userLessonProgress.findMany({ where: { userId, lesson: { module: { courseId: course.id } } }, select: { lessonId: true, progressPct: true, status: true } }) : [];
  const progressMap = new Map(lessonProgress.map((item) => [item.lessonId, item]));
  return { ...course, summary: course.summary || course.subtitle, progress, modules: course.modules.map((module) => ({ ...module, lessons: module.lessons.map((lesson) => ({ ...lesson, progress: progressMap.get(lesson.id) ?? null })) })) };
}

export async function getLesson(lessonId: string, userId?: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, status: 'PUBLISHED' },
    include: {
      module: { include: { course: { select: { id: true, slug: true, title: true, coverColor: true } } } },
      sections: { orderBy: { sortOrder: 'asc' } },
      contentBlocks: { orderBy: { sortOrder: 'asc' } },
      lessonWords: { orderBy: { sortOrder: 'asc' }, include: { vocabulary: true } },
      listening: { orderBy: { sortOrder: 'asc' }, include: { questions: true } },
      speaking: { orderBy: { sortOrder: 'asc' } },
      reading: { orderBy: { sortOrder: 'asc' }, include: { questions: true } },
      writing: { orderBy: { sortOrder: 'asc' } },
      quizzes: { include: { questions: { orderBy: { sortOrder: 'asc' }, include: { answers: true } } } },
    },
  });
  if (!lesson) throw new HttpError(404, 'Không tìm thấy bài học.');
  const progress = userId ? await prisma.userLessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId } } }) : null;
  return { ...lesson, progress };
}

export async function completeLesson(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) throw new HttpError(404, 'Không tìm thấy bài học.');
  return prisma.$transaction(async (tx) => {
    const progress = await tx.userLessonProgress.upsert({ where: { userId_lessonId: { userId, lessonId } }, update: { progressPct: 100, status: 'COMPLETED', completedAt: new Date() }, create: { userId, lessonId, progressPct: 100, status: 'COMPLETED', completedAt: new Date() } });
    const lessonsInCourse = await tx.lesson.count({ where: { module: { courseId: lesson.module.courseId }, status: 'PUBLISHED' } });
    const completedLessons = await tx.userLessonProgress.count({ where: { userId, status: 'COMPLETED', lesson: { module: { courseId: lesson.module.courseId } } } });
    await tx.userCourseProgress.upsert({ where: { userId_courseId: { userId, courseId: lesson.module.courseId } }, update: { progressPct: Math.round((completedLessons / lessonsInCourse) * 100), status: completedLessons >= lessonsInCourse ? 'COMPLETED' : 'IN_PROGRESS', lastLessonId: lessonId }, create: { userId, courseId: lesson.module.courseId, progressPct: Math.round((completedLessons / lessonsInCourse) * 100), status: 'IN_PROGRESS', lastLessonId: lessonId } });
    await tx.experienceLog.create({ data: { userId, amount: 20, reason: 'Hoàn thành bài học' } });
    return progress;
  });
}
