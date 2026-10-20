import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import candidateRoutes from './routes/candidate.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import metaRoutes from './routes/meta.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';

export const createApp = (): Express => {
  const app = express();

  // 1. Trust Single Reverse Proxy (Required for Render, Vercel, Railway)
  app.set('trust proxy', 1);

  // 2. HTTP Security Headers
  app.use(helmet());

  // 3. CORS Configuration
  const configuredOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());
  const allowedOrigins = [...configuredOrigins, 'http://localhost:5173', 'http://127.0.0.1:5173'];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          env.CLIENT_ORIGIN === '*' ||
          allowedOrigins.includes(origin) ||
          (origin.endsWith('.vercel.app') && env.CLIENT_ORIGIN.includes('vercel.app')) ||
          env.NODE_ENV === 'development'
        ) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // 4. Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // 5. Body Parsing with Size Limits (10kb prevents payload memory exhaustion)
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // 6. Rate Limiting (600 requests / 15 min, /api/health exempt)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health' || req.path === '/health',
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    }
  });
  app.use('/api', apiLimiter);

  // 7. Routes
  app.use('/api', healthRoutes);
  app.use('/api/candidates', candidateRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/meta', metaRoutes);

  // Root welcome / health ping
  app.get('/', (_req, res) => {
    res.json({
      name: 'EarlyJobs Mini ATS API',
      version: '1.0.0',
      health: '/api/health'
    });
  });

  // 8. 404 & Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
