import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDatabase = async (): Promise<void> => {
  if (env.NODE_ENV === 'test' && !env.MONGODB_URI) {
    return; // Integration tests use mongodb-memory-server
  }

  mongoose.connection.on('connected', () => {
    console.log('\x1b[32m%s\x1b[0m', '✅ [database] MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('\x1b[31m%s\x1b[0m', `❌ [database] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  [database] MongoDB disconnected');
  });

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // Fast-fail in 5s if Atlas is blocked or unreachable
    });
  } catch (error: any) {
    if (env.NODE_ENV === 'development') {
      console.warn('\x1b[33m%s\x1b[0m', '⚠️  [database] Atlas unreachable (check IP whitelist). Launching local in-memory MongoDB for dev...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log('\x1b[32m%s\x1b[0m', '✅ [database] Local in-memory MongoDB connected successfully');

      const { Candidate } = await import('../models/Candidate.js');
      const count = await Candidate.countDocuments();
      if (count === 0) {
        const { SEED_CANDIDATES } = await import('../scripts/seed.js');
        await Candidate.insertMany(SEED_CANDIDATES);
        console.log('\x1b[32m%s\x1b[0m', `🌱 [database] Seeded ${SEED_CANDIDATES.length} realistic candidates into local database`);
      }
      return;
    }
    console.error('\x1b[31m%s\x1b[0m', `❌ [database] Initial connection failed: ${error.message}`);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('[database] MongoDB connection closed.');
  } catch (err: any) {
    console.error('[database] Disconnect error:', err.message);
  }
};
