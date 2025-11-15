import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import gameRoutes from './routes/gameRoutes';
import agentRoutes from './routes/agentRoutes';
import healthRoutes from './routes/healthRoutes';

const app = express();

/**
 * Middleware
 */
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/**
 * Routes
 */
app.use('/api/health', healthRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/agent', agentRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FinQuest API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      game: '/api/game',
      agents: '/api/agent',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

/**
 * Start server
 */
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 FinQuest Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS enabled for: ${config.frontendUrl}`);
});

export default app;
