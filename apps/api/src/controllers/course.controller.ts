import type { Request, Response } from 'express';
import { z } from 'zod';
import { completeLesson, getCourseBySlug, getLesson, listCourses } from '../services/course.service.js';
import { success } from '../utils/http.js';

export async function courses(req: Request, res: Response) {
  const query = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(50).default(12), search: z.string().optional(), level: z.string().optional() }).parse(req.query);
  return success(res, await listCourses(query));
}

export async function course(req: Request, res: Response) {
  return success(res, await getCourseBySlug(String(req.params.slug), req.user?.id));
}

export async function lesson(req: Request, res: Response) {
  return success(res, await getLesson(String(req.params.id), req.user?.id));
}

export async function complete(req: Request, res: Response) {
  return success(res, await completeLesson(req.user!.id, String(req.params.id)), 'Đã lưu tiến độ.');
}
