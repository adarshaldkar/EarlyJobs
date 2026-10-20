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
      serverSelectionTimeoutMS: 10000 // 10s timeout for cloud deployments (Render -> Atlas)
    });
  } catch (error: any) {
    if (env.NODE_ENV === 'development') {
      console.warn('\x1b[33m%s\x1b[0m', '⚠️  [database] Atlas unreachable (check IP whitelist). Launching local in-memory MongoDB for dev...');
      const memPkg = 'mongodb-memory-server';
      const { MongoMemoryServer } = await (import(memPkg) as Promise<any>);
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log('\x1b[32m%s\x1b[0m', '✅ [database] Local in-memory MongoDB connected successfully');

      const { Candidate } = await import('../models/Candidate.js');
      const { Job } = await import('../models/Job.js');
      const { Interview } = await import('../models/Interview.js');

      const count = await Candidate.countDocuments();
      if (count === 0) {
        const { SEED_CANDIDATES, SEED_JOBS, SEED_INTERVIEWS } = await import('../scripts/seed.js');
        const insertedCandidates = await Candidate.insertMany(SEED_CANDIDATES);
        console.log('\x1b[32m%s\x1b[0m', `🌱 [database] Seeded ${SEED_CANDIDATES.length} realistic candidates into local database`);

        await Job.insertMany(SEED_JOBS);
        console.log('\x1b[32m%s\x1b[0m', `🌱 [database] Seeded ${SEED_JOBS.length} job openings into local database`);

        const emailMap = new Map(insertedCandidates.map((c: any) => [c.email, c._id]));
        const interviewsWithCandidateId = SEED_INTERVIEWS.map((interview: any) => ({
          ...interview,
          candidateId: emailMap.get(interview.candidateEmail) || undefined
        }));
        await Interview.insertMany(interviewsWithCandidateId);
        console.log('\x1b[32m%s\x1b[0m', `🌱 [database] Seeded ${SEED_INTERVIEWS.length} scheduled interviews into local database`);
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
