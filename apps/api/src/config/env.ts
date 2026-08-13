import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1).default('postgresql://hanlearn:hanlearn@localhost:5432/hanlearn?schema=public'),
  JWT_ACCESS_SECRET: z.string().min(16).default('local-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(16).default('local-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./uploads'),
});

export const env = envSchema.parse(process.env);
