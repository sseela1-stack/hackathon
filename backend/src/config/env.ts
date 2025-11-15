import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nessie: {
    apiKey: process.env.NESSIE_API_KEY || '',
    baseUrl: process.env.NESSIE_BASE_URL || 'http://api.nessieisreal.com',
  },
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4',
  },
};
