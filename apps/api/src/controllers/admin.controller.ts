import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { HttpError, pagination, success } from '../utils/http.js';

const userStatusSchema = z.enum(['ACTIVE', 'DISABLED', 'PENDING']);
const userRoleSchema = z.enum(['student', 'teacher', 'admin']);
const courseStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
const mediaUrlSchema = z.string().trim().min(1).max(2000).refine((value) => value.startsWith('/') || /^https?:\/\//i.test(value), 'URL media phải bắt đầu bằng http://, https:// hoặc /.');
const courseInputSchema = z.object({
  title: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang.'),
  subtitle: z.string().trim().min(2).max(180).optional(),
  summary: z.string().trim().min(10).max(280).optional(),
  description: z.string().min(10).max(1000),
  levelCode: z.string().regex(/^HSK[1-6]$/),
  categorySlug: z.string().min(2).max(60),
  durationHours: z.coerce.number().int().min(1).max(500),
  coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  coverImageUrl: mediaUrlSchema.optional().nullable(),
  coverImageAlt: z.string().trim().max(240).optional().nullable(),
  demoVideoUrl: mediaUrlSchema.optional().nullable(),
  demoVideoThumbnailUrl: mediaUrlSchema.optional().nullable(),
  status: courseStatusSchema.default('DRAFT'),
});
const moduleInputSchema = z.object({
  title: z.string().min(2).max(120),
  subtitle: z.string().max(180).optional(),
  sortOrder: z.coerce.number().int().min(1).max(10000).optional(),
});
const lessonInputSchema = z.object({
  moduleId: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang.'),
  title: z.string().min(2).max(160),
  summary: z.string().min(2).max(1000),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  sortOrder: z.coerce.number().int().min(1).max(10000).optional(),
  status: courseStatusSchema.default('DRAFT'),
});
const contentBlockTypeSchema = z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'EMBED', 'CALLOUT', 'DIVIDER']);
const contentBlockInputSchema = z.object({
  type: contentBlockTypeSchema,
  title: z.string().trim().max(160).optional().nullable(),
  body: z.string().max(20000).optional().nullable(),
  assetUrl: z.string().trim().max(2000).optional().nullable(),
  thumbnailUrl: z.string().trim().max(2000).optional().nullable(),
  mimeType: z.string().trim().max(120).optional().nullable(),
  durationSeconds: z.coerce.number().int().min(0).max(86400).optional().nullable(),
  altText: z.string().trim().max(240).optional().nullable(),
  caption: z.string().trim().max(500).optional().nullable(),
});
const deleteConfirmSchema = z.object({ confirm: z.literal(true) });

function courseSummary(input: { summary?: string | null; subtitle?: string | null }) {
  return input.summary?.trim() || input.subtitle?.trim() || '';
}

function assertPublishableCourse(input: { summary?: string | null; subtitle?: string | null; description?: string | null; coverImageUrl?: string | null; coverImageAlt?: string | null; demoVideoUrl?: string | null }, status: string) {
  if (status !== 'PUBLISHED') return;
  const missing: string[] = [];
  if (courseSummary(input).length < 10) missing.push('tóm tắt');
  if (!input.description?.trim()) missing.push('mô tả');
  if (!input.coverImageUrl) missing.push('ảnh đại diện');
  if (!input.coverImageAlt?.trim()) missing.push('văn bản thay thế cho ảnh');
  if (!input.demoVideoUrl) missing.push('video demo');
  if (missing.length) throw new HttpError(400, `Không thể xuất bản khóa học vì còn thiếu: ${missing.join(', ')}.`);
}

function assertContentBlock(input: z.infer<typeof contentBlockInputSchema>) {
  const needsAsset = ['IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'EMBED'].includes(input.type);
  if (needsAsset && !input.assetUrl) throw new HttpError(400, 'Nội dung này cần có URL hoặc tệp media.');
  if (['TEXT', 'CALLOUT'].includes(input.type) && !input.body?.trim()) throw new HttpError(400, 'Nội dung văn bản không được để trống.');
  for (const field of ['assetUrl', 'thumbnailUrl'] as const) {
    const value = input[field];
    if (value && !value.startsWith('/') && !/^https?:\/\//i.test(value)) throw new HttpError(400, `${field === 'assetUrl' ? 'URL media' : 'Ảnh đại diện'} phải bắt đầu bằng http://, https:// hoặc /.`);
  }
}

export async function summary(_req: Request, res: Response) {
  const [users, activeUsers, courses, publishedCourses, lessons, vocabulary, hskLevels, listening, speaking, reading, writing, notifications] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE', lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    prisma.course.count(),
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
    prisma.lesson.count(),
    prisma.vocabulary.count({ where: { language: 'zh-CN' } }),
    prisma.hskLevel.count(),
    prisma.listeningExercise.count(),
    prisma.speakingExercise.count(),
    prisma.readingExercise.count(),
    prisma.writingExercise.count(),
    prisma.notification.count(),
  ]);
  return success(res, { users, activeUsers, courses, publishedCourses, lessons, vocabulary, hskLevels, exercises: listening + speaking + reading + writing, notifications, revenue: 0 });
}

export async function adminUsers(req: Request, res: Response) {
  const query = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(50), search: z.string().trim().optional(), role: userRoleSchema.optional(), status: userStatusSchema.optional() }).parse(req.query);
  const where = {
    ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { email: { contains: query.search, mode: 'insensitive' as const } }] } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.role ? { roles: { some: { role: { code: query.role } } } } : {}),
  };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit, include: { roles: { include: { role: true } }, profile: true, _count: { select: { notifications: true, courseProgress: true } } } }),
    prisma.user.count({ where }),
  ]);
  return success(res, { items: users.map((user) => ({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, status: user.status, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt, level: user.profile?.currentLevel, roles: user.roles.map(({ role }) => role.code), notificationCount: user._count.notifications, courseCount: user._count.courseProgress })), pagination: pagination(query.page, query.limit, total) });
}

export async function updateUserStatus(req: Request, res: Response) {
  const status = userStatusSchema.parse(req.body?.status);
  const userId = String(req.params.id);
  if (userId === req.user?.id) throw new HttpError(400, 'Bạn không thể tự khóa tài khoản quản trị của mình.');
  const user = await prisma.user.update({ where: { id: userId }, data: { status } });
  return success(res, { id: user.id, status: user.status }, 'Đã cập nhật trạng thái người dùng.');
}

export async function updateUserRole(req: Request, res: Response) {
  const roleCode = userRoleSchema.parse(req.body?.role);
  const userId = String(req.params.id);
  if (userId === req.user?.id) throw new HttpError(400, 'Bạn không thể tự thay đổi vai trò quản trị của mình.');
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) throw new HttpError(404, 'Vai trò chưa được cấu hình.');
  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId } }),
    prisma.userRole.create({ data: { userId, roleId: role.id } }),
  ]);
  return success(res, { id: userId, role: role.code }, 'Đã cập nhật vai trò người dùng.');
}

export async function adminCourses(req: Request, res: Response) {
  const query = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(50), search: z.string().trim().optional(), status: courseStatusSchema.optional(), level: z.string().optional() }).parse(req.query);
  const where = {
    ...(query.search ? { OR: [{ title: { contains: query.search, mode: 'insensitive' as const } }, { slug: { contains: query.search, mode: 'insensitive' as const } }] } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.level ? { level: { code: query.level } } : {}),
  };
  const [courses, total] = await prisma.$transaction([
    prisma.course.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit, include: { level: true, category: true, modules: { select: { id: true, _count: { select: { lessons: true } } } }, _count: { select: { progress: true } } } }),
    prisma.course.count({ where }),
  ]);
  return success(res, { items: courses.map((course) => ({ id: course.id, slug: course.slug, title: course.title, subtitle: course.subtitle, summary: course.summary || course.subtitle, description: course.description, coverColor: course.coverColor, coverImageUrl: course.coverImageUrl, coverImageAlt: course.coverImageAlt, demoVideoUrl: course.demoVideoUrl, demoVideoThumbnailUrl: course.demoVideoThumbnailUrl, durationHours: course.durationHours, status: course.status, createdAt: course.createdAt, updatedAt: course.updatedAt, level: course.level, category: course.category, moduleCount: course.modules.length, lessonCount: course.modules.reduce((totalLessons, module) => totalLessons + module._count.lessons, 0), learnerCount: course._count.progress })), pagination: pagination(query.page, query.limit, total) });
}

export async function createCourse(req: Request, res: Response) {
  const input = courseInputSchema.parse(req.body);
  const summary = courseSummary(input);
  if (summary.length < 10) throw new HttpError(400, 'Tóm tắt khóa học phải có ít nhất 10 ký tự.');
  assertPublishableCourse({ ...input, summary }, input.status);
  const [level, category] = await Promise.all([
    prisma.courseLevel.findUnique({ where: { code: input.levelCode } }),
    prisma.courseCategory.findUnique({ where: { slug: input.categorySlug } }),
  ]);
  if (!level) throw new HttpError(404, 'Không tìm thấy cấp độ HSK.');
  if (!category) throw new HttpError(404, 'Không tìm thấy danh mục khóa học.');
  const course = await prisma.course.create({ data: { title: input.title, slug: input.slug, subtitle: (input.subtitle ?? summary).slice(0, 180), summary, description: input.description, coverColor: input.coverColor, coverImageUrl: input.coverImageUrl, coverImageAlt: input.coverImageAlt, demoVideoUrl: input.demoVideoUrl, demoVideoThumbnailUrl: input.demoVideoThumbnailUrl, durationHours: input.durationHours, status: input.status, levelId: level.id, categoryId: category.id, modules: { create: { title: 'Module 1 · Bắt đầu', subtitle: 'Từng bước vững chắc', sortOrder: 1 } } }, include: { level: true, category: true } });
  return success(res, course, 'Đã tạo khóa học.', 201);
}

export async function updateCourse(req: Request, res: Response) {
  const input = courseInputSchema.partial().parse(req.body);
  const courseId = String(req.params.id);
  const existing = await prisma.course.findUnique({ where: { id: courseId } });
  if (!existing) throw new HttpError(404, 'Không tìm thấy khóa học.');
  const summary = courseSummary({ summary: input.summary ?? existing.summary, subtitle: input.subtitle ?? existing.subtitle });
  const nextStatus = input.status ?? existing.status;
  assertPublishableCourse({ summary, description: input.description ?? existing.description, coverImageUrl: input.coverImageUrl ?? existing.coverImageUrl, coverImageAlt: input.coverImageAlt ?? existing.coverImageAlt, demoVideoUrl: input.demoVideoUrl ?? existing.demoVideoUrl }, nextStatus);
  const data: Record<string, unknown> = { ...input };
  if (input.summary !== undefined || input.subtitle !== undefined) {
    data.summary = summary;
    data.subtitle = (input.subtitle ?? summary).slice(0, 180);
  }
  if (input.levelCode) {
    const level = await prisma.courseLevel.findUnique({ where: { code: input.levelCode } });
    if (!level) throw new HttpError(404, 'Không tìm thấy cấp độ HSK.');
    data.levelId = level.id;
  }
  if (input.categorySlug) {
    const category = await prisma.courseCategory.findUnique({ where: { slug: input.categorySlug } });
    if (!category) throw new HttpError(404, 'Không tìm thấy danh mục khóa học.');
    data.categoryId = category.id;
  }
  delete data.levelCode;
  delete data.categorySlug;
  const course = await prisma.course.update({ where: { id: courseId }, data, include: { level: true, category: true } });
  return success(res, course, 'Đã cập nhật khóa học.');
}

export async function createModule(req: Request, res: Response) {
  const input = moduleInputSchema.parse(req.body);
  const courseId = String(req.params.courseId);
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) throw new HttpError(404, 'Không tìm thấy khóa học.');
  const maxSortOrder = await prisma.module.aggregate({ where: { courseId }, _max: { sortOrder: true } });
  const module = await prisma.module.create({ data: { courseId, title: input.title, subtitle: input.subtitle, sortOrder: input.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1 } });
  return success(res, module, 'Đã tạo nhánh module.', 201);
}

export async function updateModule(req: Request, res: Response) {
  const input = moduleInputSchema.partial().parse(req.body);
  const moduleId = String(req.params.id);
  const existing = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!existing) throw new HttpError(404, 'Không tìm thấy nhánh module.');
  const module = await prisma.module.update({ where: { id: moduleId }, data: input });
  return success(res, module, 'Đã cập nhật nhánh module.');
}

export async function deleteModule(req: Request, res: Response) {
  deleteConfirmSchema.parse(req.body);
  const moduleId = String(req.params.id);
  const existing = await prisma.module.findUnique({ where: { id: moduleId }, include: { _count: { select: { lessons: true } } } });
  if (!existing) throw new HttpError(404, 'Không tìm thấy nhánh module.');
  await prisma.module.delete({ where: { id: moduleId } });
  return success(res, { id: moduleId, deletedLessons: existing._count.lessons }, 'Đã xóa nhánh module và các bài học con.');
}

export async function createLesson(req: Request, res: Response) {
  const input = lessonInputSchema.parse(req.body);
  const moduleId = String(req.params.moduleId);
  if (input.moduleId && input.moduleId !== moduleId) throw new HttpError(400, 'Nhánh module trong URL và dữ liệu không trùng khớp.');
  const module = await prisma.module.findUnique({ where: { id: moduleId }, include: { course: { select: { id: true, title: true } } } });
  if (!module) throw new HttpError(404, 'Không tìm thấy nhánh module.');
  const maxSortOrder = await prisma.lesson.aggregate({ where: { moduleId }, _max: { sortOrder: true } });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      durationMinutes: input.durationMinutes,
      sortOrder: input.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1,
      status: input.status,
      sections: { create: [{ type: 'INTRODUCTION', title: 'Khởi động', body: input.summary, sortOrder: 1 }, { type: 'VOCABULARY', title: 'Từ vựng trọng tâm', body: 'Thêm từ vựng phù hợp với bài học này.', sortOrder: 2 }, { type: 'SUMMARY', title: 'Tổng kết', body: 'Ôn lại nội dung chính trước khi chuyển sang bài tiếp theo.', sortOrder: 3 }] },
      contentBlocks: { create: [{ type: 'TEXT', title: 'Mục tiêu bài học', body: input.summary, sortOrder: 1 }] },
    },
    include: { module: { include: { course: { select: { id: true, title: true } } } } },
  });
  return success(res, lesson, 'Đã tạo bài học.', 201);
}

export async function updateLesson(req: Request, res: Response) {
  const input = lessonInputSchema.partial().parse(req.body);
  const lessonId = String(req.params.id);
  const existing = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!existing) throw new HttpError(404, 'Không tìm thấy bài học.');
  if (input.moduleId) {
    const module = await prisma.module.findUnique({ where: { id: input.moduleId }, select: { id: true } });
    if (!module) throw new HttpError(404, 'Không tìm thấy nhánh module đích.');
  }
  const lesson = await prisma.lesson.update({ where: { id: lessonId }, data: input, include: { module: { include: { course: { select: { id: true, title: true } } } } } });
  return success(res, lesson, 'Đã cập nhật bài học.');
}

export async function deleteLesson(req: Request, res: Response) {
  deleteConfirmSchema.parse(req.body);
  const lessonId = String(req.params.id);
  const existing = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, title: true } });
  if (!existing) throw new HttpError(404, 'Không tìm thấy bài học.');
  await prisma.lesson.delete({ where: { id: lessonId } });
  return success(res, { id: lessonId, title: existing.title }, 'Đã xóa bài học và nội dung luyện tập liên quan.');
}

export async function adminLessons(req: Request, res: Response) {
  const query = z.object({ courseId: z.string().optional(), level: z.string().optional(), limit: z.coerce.number().int().min(1).max(200).default(100) }).parse(req.query);
  const courses = await prisma.course.findMany({
    where: { ...(query.courseId ? { id: query.courseId } : {}), ...(query.level ? { level: { code: query.level } } : {}) },
    orderBy: { title: 'asc' },
    include: {
      level: true,
      modules: {
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: {
            orderBy: { sortOrder: 'asc' },
            take: query.limit,
            include: { _count: { select: { lessonWords: true, listening: true, speaking: true, reading: true, writing: true, quizzes: true, contentBlocks: true } } },
          },
        },
      },
    },
  });
  const items = courses.map((course) => ({
    course: { id: course.id, slug: course.slug, title: course.title, level: course.level.name, levelCode: course.level.code },
    moduleCount: course.modules.length,
    lessonCount: course.modules.reduce((total, module) => total + module.lessons.length, 0),
    branches: course.modules.map((module) => ({
      id: module.id,
      title: module.title,
      subtitle: module.subtitle,
      sortOrder: module.sortOrder,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        durationMinutes: lesson.durationMinutes,
        sortOrder: lesson.sortOrder,
        status: lesson.status,
        exerciseCount: lesson._count.listening + lesson._count.speaking + lesson._count.reading + lesson._count.writing + lesson._count.quizzes,
        vocabularyCount: lesson._count.lessonWords,
        contentCount: lesson._count.contentBlocks,
      })),
    })),
  }));
  return success(res, { items, totalCourses: items.length, totalLessons: items.reduce((total, item) => total + item.lessonCount, 0) });
}

export async function adminLessonContent(req: Request, res: Response) {
  const lessonId = String(req.params.id);
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { course: { select: { id: true, slug: true, title: true, coverColor: true } } } },
      contentBlocks: { orderBy: { sortOrder: 'asc' } },
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!lesson) throw new HttpError(404, 'Không tìm thấy bài học.');
  return success(res, lesson);
}

export async function createContentBlock(req: Request, res: Response) {
  const input = contentBlockInputSchema.parse(req.body);
  assertContentBlock(input);
  const lessonId = String(req.params.lessonId);
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
  if (!lesson) throw new HttpError(404, 'Không tìm thấy bài học.');
  const max = await prisma.lessonContentBlock.aggregate({ where: { lessonId }, _max: { sortOrder: true } });
  const block = await prisma.lessonContentBlock.create({ data: { lessonId, ...input, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  return success(res, block, 'Đã thêm nội dung bài học.', 201);
}

export async function updateContentBlock(req: Request, res: Response) {
  const input = contentBlockInputSchema.partial().parse(req.body);
  const blockId = String(req.params.id);
  const existing = await prisma.lessonContentBlock.findUnique({ where: { id: blockId } });
  if (!existing) throw new HttpError(404, 'Không tìm thấy nội dung bài học.');
  const merged = { ...existing, ...input };
  assertContentBlock(merged);
  const block = await prisma.lessonContentBlock.update({ where: { id: blockId }, data: input });
  return success(res, block, 'Đã cập nhật nội dung bài học.');
}

export async function deleteContentBlock(req: Request, res: Response) {
  deleteConfirmSchema.parse(req.body);
  const blockId = String(req.params.id);
  const existing = await prisma.lessonContentBlock.findUnique({ where: { id: blockId }, select: { id: true, title: true } });
  if (!existing) throw new HttpError(404, 'Không tìm thấy nội dung bài học.');
  await prisma.lessonContentBlock.delete({ where: { id: blockId } });
  return success(res, existing, 'Đã xóa nội dung bài học.');
}

export async function moveContentBlock(req: Request, res: Response) {
  const direction = z.enum(['up', 'down']).parse(req.body?.direction);
  const blockId = String(req.params.id);
  const existing = await prisma.lessonContentBlock.findUnique({ where: { id: blockId } });
  if (!existing) throw new HttpError(404, 'Không tìm thấy nội dung bài học.');
  const neighbour = await prisma.lessonContentBlock.findFirst({
    where: { lessonId: existing.lessonId, sortOrder: direction === 'up' ? { lt: existing.sortOrder } : { gt: existing.sortOrder } },
    orderBy: { sortOrder: direction === 'up' ? 'desc' : 'asc' },
  });
  if (!neighbour) return success(res, existing, 'Nội dung đã ở vị trí đầu/cuối.');
  const updated = await prisma.$transaction(async (tx) => {
    await tx.lessonContentBlock.update({ where: { id: existing.id }, data: { sortOrder: 0 } });
    await tx.lessonContentBlock.update({ where: { id: neighbour.id }, data: { sortOrder: existing.sortOrder } });
    return tx.lessonContentBlock.update({ where: { id: existing.id }, data: { sortOrder: neighbour.sortOrder } });
  });
  return success(res, updated, 'Đã sắp xếp nội dung bài học.');
}

export async function adminHskOverview(_req: Request, res: Response) {
  const levels = await prisma.hskLevel.findMany({ orderBy: { order: 'asc' }, include: { _count: { select: { vocabulary: true } } } });
  const items = await Promise.all(levels.map(async (level) => {
    const courseLevel = await prisma.courseLevel.findUnique({ where: { code: level.code } });
    const courses = courseLevel ? await prisma.course.findMany({ where: { levelId: courseLevel.id }, select: { id: true } }) : [];
    const courseIds = courses.map((course) => course.id);
    const lessonWhere = { lesson: { module: { courseId: { in: courseIds } } } };
    const [listening, speaking, reading, writing] = await prisma.$transaction([
      prisma.listeningExercise.count({ where: lessonWhere }),
      prisma.speakingExercise.count({ where: lessonWhere }),
      prisma.readingExercise.count({ where: lessonWhere }),
      prisma.writingExercise.count({ where: lessonWhere }),
    ]);
    return { code: level.code, name: level.name, description: level.description, vocabularyCount: level._count.vocabulary, courseCount: courses.length, exerciseCount: listening + speaking + reading + writing, skillBreakdown: { listening, speaking, reading, writing } };
  }));
  return success(res, items);
}

export async function adminNotifications(_req: Request, res: Response) {
  const [items, total] = await prisma.$transaction([
    prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { user: { select: { name: true, email: true } } } }),
    prisma.notification.count(),
  ]);
  return success(res, { items, total });
}

export async function broadcastNotification(req: Request, res: Response) {
  const input = z.object({ title: z.string().min(2).max(120), body: z.string().min(2).max(1000), type: z.string().min(2).max(40).default('ANNOUNCEMENT'), audience: z.enum(['ALL', 'STUDENTS', 'TEACHERS', 'ADMINS']).default('ALL'), userId: z.string().optional() }).parse(req.body);
  const roleCode = input.audience === 'STUDENTS' ? 'student' : input.audience === 'TEACHERS' ? 'teacher' : input.audience === 'ADMINS' ? 'admin' : undefined;
  const users = await prisma.user.findMany({ where: { status: 'ACTIVE', ...(input.userId ? { id: input.userId } : {}), ...(roleCode ? { roles: { some: { role: { code: roleCode } } } } : {}) }, select: { id: true } });
  if (!users.length) return success(res, { sent: 0 }, 'Không có người nhận phù hợp.');
  const result = await prisma.notification.createMany({ data: users.map((user) => ({ userId: user.id, title: input.title, body: input.body, type: input.type })) });
  return success(res, { sent: result.count, audience: input.audience }, `Đã gửi thông báo cho ${result.count} người dùng.`);
}
