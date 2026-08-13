import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http.js';
import { verifyAccessToken } from '../utils/tokens.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Vui lòng đăng nhập để tiếp tục.');
    const payload = verifyAccessToken(header.slice(7));
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, status: 'ACTIVE', deletedAt: null },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new HttpError(401, 'Phiên đăng nhập không còn hợp lệ.');
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map(({ role }) => role),
    };
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Phiên đăng nhập không còn hợp lệ.'));
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const roles = req.user?.roles.map((role) => role.code) ?? [];
    if (!roles.some((role) => allowedRoles.includes(role))) {
      next(new HttpError(403, 'Bạn không có quyền thực hiện thao tác này.'));
      return;
    }
    next();
  };
}
