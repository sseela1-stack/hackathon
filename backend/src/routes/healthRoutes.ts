import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check route
 * GET /api/health
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
  });
});

export default router;
