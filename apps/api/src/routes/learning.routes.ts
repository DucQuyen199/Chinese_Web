import { Router } from 'express';
import { characters, dashboard, grammar, hsk, leaderboard, radicals, review, reviewDue, skill, statistics, vocabulary } from '../controllers/learning.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

export const learningRouter = Router();
learningRouter.get('/dashboard', requireAuth, asyncHandler(dashboard));
learningRouter.get('/vocabularies', asyncHandler(vocabulary));
learningRouter.get('/reviews/due', requireAuth, asyncHandler(reviewDue));
learningRouter.post('/reviews/:id', requireAuth, asyncHandler(review));
learningRouter.get('/statistics', requireAuth, asyncHandler(statistics));
learningRouter.get('/leaderboard', asyncHandler(leaderboard));
learningRouter.get('/skills/:type', asyncHandler(skill));
learningRouter.get('/characters', asyncHandler(characters));
learningRouter.get('/radicals', asyncHandler(radicals));
learningRouter.get('/grammar', asyncHandler(grammar));
learningRouter.get('/hsk', requireAuth, asyncHandler(hsk));
