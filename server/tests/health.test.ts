import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';

describe('GET /api/health', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('returns 200 and healthy status when database is connected', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected'
      }
    });
  });

  it('returns 503 and not_ready error envelope when database is disconnected', async () => {
    // Temporarily disconnect mongoose
    await mongoose.disconnect();

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection is not ready.',
        status: 'not_ready',
        database: 'disconnected'
      }
    });

    // Reconnect for cleanup
    await mongoose.connect(mongoServer.getUri());
  });
});
