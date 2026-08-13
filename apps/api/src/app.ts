import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import { adminRouter } from './routes/admin.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { courseRouter } from './routes/course.routes.js';
import { learningRouter } from './routes/learning.routes.js';
import { mediaRouter } from './routes/media.routes.js';

export const app = express();
app.disable('x-powered-by');
// The API is behind the local Nginx reverse proxy and Cloudflare Tunnel.
// Trust the first proxy hop so rate limiting uses the real client address.
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(pinoHttp());

app.get('/health', (_req, res) => res.json({ success: true, message: 'HanLearn API is healthy', data: { service: 'api' } }));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/media', mediaRouter);
app.use('/api/v1', learningRouter);
app.use('/api/v1/admin', adminRouter);
app.use(notFound);
app.use(errorHandler);
