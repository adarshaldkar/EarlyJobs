import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    return res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected'
      }
    });
  }

  return res.status(503).json({
    success: false,
    error: {
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database connection is not ready.',
      status: 'not_ready',
      database: 'disconnected'
    }
  });
});

export default router;
