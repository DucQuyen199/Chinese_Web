import type { Request, Response } from 'express';
import { z } from 'zod';
import { getDashboard, getLeaderboard, getStatistics, listDueReviews, listVocabulary, reviewVocabulary } from '../services/learning.service.js';
import { getCharacters, getGrammar, getHskLevels, getRadicals, getSkillExercises } from '../services/skill.service.js';
import { success } from '../utils/http.js';

export async function dashboard(req: Request, res: Response) { return success(res, await getDashboard(req.user!.id)); }
export async function vocabulary(req: Request, res: Response) {
  const query = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(20), search: z.string().optional(), hsk: z.string().optional() }).parse(req.query);
  return success(res, await listVocabulary({ ...query, userId: req.user?.id }));
}
export async function reviewDue(req: Request, res: Response) { return success(res, await listDueReviews(req.user!.id)); }
export async function review(req: Request, res: Response) {
  const body = z.object({ rating: z.enum(['AGAIN', 'HARD', 'GOOD', 'EASY']) }).parse(req.body);
  return success(res, await reviewVocabulary(req.user!.id, String(req.params.id), body.rating), 'Đã lưu kết quả ôn tập.');
}
export async function statistics(req: Request, res: Response) { return success(res, await getStatistics(req.user!.id)); }
export async function leaderboard(_req: Request, res: Response) { return success(res, await getLeaderboard()); }
export async function skill(req: Request, res: Response) { const type = z.enum(['listening', 'speaking', 'reading', 'writing']).parse(req.params.type); return success(res, await getSkillExercises(type)); }
export async function characters(_req: Request, res: Response) { return success(res, await getCharacters()); }
export async function radicals(_req: Request, res: Response) { return success(res, await getRadicals()); }
export async function grammar(_req: Request, res: Response) { return success(res, await getGrammar()); }
export async function hsk(req: Request, res: Response) { return success(res, await getHskLevels(req.user!.id)); }
