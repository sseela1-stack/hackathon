import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check route
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'FinQuest Backend API',
  });
});

export default router;
