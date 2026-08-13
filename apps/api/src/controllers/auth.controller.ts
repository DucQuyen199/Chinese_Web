import type { Request, Response } from 'express';
import { z } from 'zod';
import { getCurrentUser, loginUser, refreshSession, registerUser, revokeSession } from '../services/auth.service.js';
import { success } from '../utils/http.js';
import { refreshCookieOptions } from '../utils/tokens.js';

export const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(2).max(80) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function register(req: Request, res: Response) {
  const result = await registerUser(registerSchema.parse(req.body));
  res.cookie('hanlearn_refresh', result.refreshToken, refreshCookieOptions());
  return success(res, { accessToken: result.accessToken, user: result.user }, 'Đăng ký thành công.', 201);
}

export async function login(req: Request, res: Response) {
  const result = await loginUser(loginSchema.parse(req.body));
  res.cookie('hanlearn_refresh', result.refreshToken, refreshCookieOptions());
  return success(res, { accessToken: result.accessToken, user: result.user }, 'Đăng nhập thành công.');
}

export async function refresh(req: Request, res: Response) {
  const result = await refreshSession(req);
  res.cookie('hanlearn_refresh', result.refreshToken, refreshCookieOptions());
  return success(res, { accessToken: result.accessToken, user: result.user });
}

export async function logout(req: Request, res: Response) {
  await revokeSession(req);
  res.clearCookie('hanlearn_refresh', refreshCookieOptions());
  return success(res, null, 'Đã đăng xuất.');
}

export async function me(req: Request, res: Response) {
  return success(res, await getCurrentUser(req.user!.id));
}
