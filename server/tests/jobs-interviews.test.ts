import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { Job } from '../src/models/Job.js';
import { Interview } from '../src/models/Interview.js';
import { Candidate } from '../src/models/Candidate.js';

describe('Job Requisitions, Interview Loops & Resume Upload Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([Job.init(), Interview.init(), Candidate.init()]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Promise.all([Job.deleteMany({}), Interview.deleteMany({}), Candidate.deleteMany({})]);
  });

  // 1. Job Requisition Lifecycle & Candidate Count Aggregation
  it('creates job opening and accurately calculates dynamic applicant count', async () => {
    const jobRes = await request(app)
      .post('/api/jobs')
      .send({
        title: 'Full Stack Engineer',
        department: 'Engineering',
        location: 'Bengaluru (Hybrid)',
        type: 'Full-time',
        experienceMin: 2,
        experienceMax: 5,
        openingsCount: 2,
        description: 'Build modern ATS workflows',
        requirements: ['React', 'TypeScript', 'Node.js']
      });

    expect(jobRes.status).toBe(201);
    expect(jobRes.body.success).toBe(true);
    expect(jobRes.body.data.title).toBe('Full Stack Engineer');

    // Create 2 candidates applying for this role
    await Candidate.create([
      {
        name: 'Aarav Patel',
        email: 'aarav@example.com',
        position: 'Full Stack Engineer',
        experienceYears: 3,
        stage: 'Applied'
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        position: 'Full Stack Engineer',
        experienceYears: 4,
        stage: 'Interview'
      }
    ]);

    // List jobs and verify applicantCount = 2
    const listRes = await request(app).get('/api/jobs');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].applicantCount).toBe(2);
  });

  // 2. Interview Loop Scheduling & Automated Stage History Logging
  it('schedules interview and automatically appends feedback to candidate stageHistory', async () => {
    const candidate = await Candidate.create({
      name: 'Rohan Verma',
      email: 'rohan.v@example.com',
      position: 'Backend Developer',
      experienceYears: 4,
      stage: 'Interview',
      stageHistory: [{ from: 'Applied', to: 'Interview', changedAt: new Date() }]
    });

    // Schedule interview
    const scheduleRes = await request(app)
      .post('/api/interviews')
      .send({
        candidateId: candidate._id.toString(),
        candidateName: 'Rohan Verma',
        candidateEmail: 'rohan.v@example.com',
        position: 'Backend Developer',
        round: 'Technical Architecture & System Design',
        interviewer: 'Sarah Jenkins (VP Eng)',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 45,
        meetingLink: 'https://meet.google.com/ej-test'
      });

    expect(scheduleRes.status).toBe(201);
    const interviewId = scheduleRes.body.data._id;

    // Verify interview is scheduled
    const listRes = await request(app).get('/api/interviews');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].status).toBe('Scheduled');

    // Submit evaluation feedback
    const feedbackRes = await request(app)
      .patch(`/api/interviews/${interviewId}`)
      .send({
        status: 'Completed',
        rating: 5,
        feedback: 'Exceptional system design and data modeling skills.'
      });

    expect(feedbackRes.status).toBe(200);
    expect(feedbackRes.body.data.status).toBe('Completed');
    expect(feedbackRes.body.data.rating).toBe(5);

    // Verify candidate stageHistory logged this interview event
    const updatedCandidate = await Candidate.findById(candidate._id);
    expect(updatedCandidate?.stageHistory.length).toBeGreaterThanOrEqual(2);
    const lastHistory = updatedCandidate?.stageHistory[updatedCandidate.stageHistory.length - 1];
    expect(lastHistory?.notes).toContain('Technical Architecture & System Design');
  });

  // 3. Resume File Upload
  it('uploads PDF resume and updates candidate record', async () => {
    const candidate = await Candidate.create({
      name: 'Ananya Roy',
      email: 'ananya@example.com',
      position: 'UI/UX Designer',
      experienceYears: 3,
      stage: 'Applied'
    });

    const fileBuffer = Buffer.from('%PDF-1.4 sample pdf content for test');

    const uploadRes = await request(app)
      .post(`/api/candidates/${candidate._id}/resume`)
      .attach('resume', fileBuffer, 'Ananya_Roy_CV.pdf');

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.resumeUrl).toMatch(/\/uploads\/resumes\/.*\.pdf$/);
  });
});
