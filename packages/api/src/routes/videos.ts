import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { param } from '../middleware/params';

const prisma = new PrismaClient();
const router = Router();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

// List videos for a session
router.get(
  '/sessions/:sessionId/videos',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const sessionId = param(req, 'sessionId');
    const videos = await prisma.video.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(videos);
  },
);

// Upload a video
router.post(
  '/sessions/:sessionId/videos',
  authenticate,
  upload.single('video'),
  async (req: AuthRequest, res: Response) => {
    const sessionId = param(req, 'sessionId');
    const viewType = req.body.viewType;

    if (!viewType || !['front', 'side'].includes(viewType)) {
      res.status(400).json({ error: 'viewType must be "front" or "side"' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No video file provided' });
      return;
    }

    const session = await prisma.screeningSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Remove any existing video of same viewType for this session
    const existing = await prisma.video.findFirst({
      where: { sessionId, viewType },
    });
    if (existing) {
      const oldPath = path.join(uploadsDir, existing.filename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      await prisma.video.delete({ where: { id: existing.id } });
    }

    const video = await prisma.video.create({
      data: {
        sessionId,
        viewType,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });

    res.status(201).json(video);
  },
);

// Stream a video with Range support
// Supports auth via query ?token= for <video> elements that can't send headers
router.get(
  '/videos/:id/stream',
  (req: AuthRequest, res: Response, next) => {
    if (!req.headers.authorization && req.query.token) {
      req.headers.authorization = `Bearer ${req.query.token}`;
    }
    next();
  },
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const id = param(req, 'id');
    const video = await prisma.video.findUnique({ where: { id } });

    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    const filePath = path.join(uploadsDir, video.filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Video file not found on disk' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimeType,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType,
      });
      fs.createReadStream(filePath).pipe(res);
    }
  },
);

// Delete a video
router.delete(
  '/videos/:id',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const id = param(req, 'id');
    const video = await prisma.video.findUnique({ where: { id } });

    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    const filePath = path.join(uploadsDir, video.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.video.delete({ where: { id } });
    res.json({ message: 'Video deleted' });
  },
);

export { router as videoRouter };
