import { Router } from 'express';
import { complete, course, courses, lesson } from '../controllers/course.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

export const courseRouter = Router();
courseRouter.get('/', asyncHandler(courses));
courseRouter.get('/:slug', asyncHandler(course));
courseRouter.get('/lessons/:id', asyncHandler(lesson));
courseRouter.post('/lessons/:id/complete', requireAuth, asyncHandler(complete));
