import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http.js';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, message: 'Không tìm thấy tài nguyên.' });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(422).json({ success: false, message: 'Dữ liệu chưa hợp lệ.', errors: error.flatten() });
    return;
  }
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof HttpError ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ success: false, message, ...(error instanceof HttpError && error.details ? { errors: error.details } : {}) });
};
