import bcrypt from 'bcryptjs';
import type { Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http.js';
import { createAccessToken, createRefreshToken, hashToken } from '../utils/tokens.js';

type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: Array<{ role: { code: string; name: string } }>;
  profile: unknown;
};

const userWithRoles = {
  roles: { include: { role: true } },
  profile: true,
} as const;

export async function registerUser(input: { email: string; password: string; name: string }) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, 'Email này đã được sử dụng.');
  const passwordHash = await bcrypt.hash(input.password, 12);
  const role = await prisma.role.upsert({
    where: { code: 'student' },
    update: {},
    create: { code: 'student', name: 'Học viên' },
  });
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name.trim(),
      profile: { create: { currentLevel: 'HSK 1', dailyTarget: 15 } },
      streak: { create: {} },
      roles: { create: { roleId: role.id } },
    },
    include: userWithRoles,
  });
  return issueSession(user);
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase().trim() }, include: userWithRoles });
  if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, 'Email hoặc mật khẩu chưa chính xác.');
  }
  if (user.status !== 'ACTIVE') throw new HttpError(403, 'Tài khoản của bạn đang tạm khóa.');
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return issueSession(user);
}

export async function refreshSession(req: Request) {
  const rawToken = req.cookies?.hanlearn_refresh as string | undefined;
  if (!rawToken) throw new HttpError(401, 'Không tìm thấy refresh token.');
  const token = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken) }, include: { user: { include: userWithRoles } } });
  if (!token || token.revokedAt || token.expiresAt < new Date() || token.user.status !== 'ACTIVE') {
    throw new HttpError(401, 'Refresh token không còn hợp lệ.');
  }
  await prisma.refreshToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } });
  return issueSession(token.user);
}

export async function revokeSession(req: Request) {
  const rawToken = req.cookies?.hanlearn_refresh as string | undefined;
  if (rawToken) await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(rawToken), revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { ...userWithRoles, streak: true } });
  if (!user) throw new HttpError(404, 'Không tìm thấy người dùng.');
  return serializeUser(user);
}

async function issueSession(user: SessionUser) {
  const refresh = createRefreshToken(user.id);
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: refresh.hash, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
  const accessToken = createAccessToken({ sub: user.id, email: user.email, name: user.name, roles: user.roles.map(({ role }) => role.code) });
  return { accessToken, refreshToken: refresh.token, user: serializeUser(user) };
}

function serializeUser(user: { id: string; email: string; name: string; avatarUrl?: string | null; roles: Array<{ role: { code: string; name: string } }>; profile?: unknown; streak?: unknown }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    roles: user.roles.map(({ role }) => role.code),
    profile: user.profile,
    streak: user.streak,
  };
}
