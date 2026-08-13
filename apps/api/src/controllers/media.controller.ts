import type { Request, Response } from 'express';
import { success } from '../utils/http.js';

export async function uploadMedia(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn một tệp media.', data: null });
  }
  return success(res, {
    url: `/api/v1/media/files/${encodeURIComponent(req.file.filename)}`,
    name: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  }, 'Đã tải tệp lên.', 201);
}
