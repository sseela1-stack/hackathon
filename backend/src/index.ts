import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Get configuration from environment
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Middleware
 */
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

/**
 * Routes
 */
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 CORS enabled for: ${FRONTEND_URL}`);
});

export default app;
