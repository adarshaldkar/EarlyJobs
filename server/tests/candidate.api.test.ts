import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { Candidate } from '../src/models/Candidate.js';

describe('Candidate API & Business Logic Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    // Ensure unique indexes are built before running test assertions
    await Candidate.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Candidate.deleteMany({});
  });

  // =========================================================================
  // Test 1: Duplicate Email Rejection
  // =========================================================================
  it('Test 1: rejects duplicate candidate email with 409 DUPLICATE_EMAIL', async () => {
    const payload = {
      name: 'Aarav Patel',
      email: 'aarav.patel@example.com',
      position: 'Senior Frontend Engineer',
      experienceYears: 4,
      skills: ['React', 'TypeScript', 'Tailwind'],
      resumeUrl: 'https://example.com/aarav-resume.pdf'
    };

    // First creation succeeds
    const res1 = await request(app).post('/api/candidates').send(payload);
    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.email).toBe('aarav.patel@example.com');
    expect(res1.body.data.stage).toBe('Applied');
    expect(res1.body.data.stageHistory).toHaveLength(1);
    expect(res1.body.data.stageHistory[0].from).toBeNull();
    expect(res1.body.data.stageHistory[0].to).toBe('Applied');

    // Duplicate email with spaces/casing
    const duplicatePayload = {
      ...payload,
      name: 'Aarav Duplicate',
      email: '  AARAV.PATEL@example.com  '
    };

    const res2 = await request(app).post('/api/candidates').send(duplicatePayload);
    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.error.code).toBe('DUPLICATE_EMAIL');
    expect(res2.body.error.message).toContain('already exists');

    // Email is strictly immutable via PATCH
    const candidateId = res1.body.data._id;
    const patchEmailRes = await request(app)
      .patch(`/api/candidates/${candidateId}`)
      .send({ email: 'newemail@example.com' });

    expect(patchEmailRes.status).toBe(400);
    expect(patchEmailRes.body.success).toBe(false);
    expect(patchEmailRes.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(patchEmailRes.body.error.details)).toContain('immutable');
  });

  // =========================================================================
  // Test 2: Concurrency Conflict Detection
  // =========================================================================
  it('Test 2: detects concurrent stage updates and yields exactly one 200 and one 409 STALE_STATE', async () => {
    const created = await Candidate.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      position: 'Backend Developer',
      experienceYears: 5,
      stage: 'Applied',
      stageHistory: [{ from: null, to: 'Applied', changedAt: new Date() }]
    });

    const candidateId = created._id.toString();

    // Two parallel requests both believing currentStage is 'Applied'
    const [resA, resB] = await Promise.all([
      request(app)
        .patch(`/api/candidates/${candidateId}/stage`)
        .send({ currentStage: 'Applied', newStage: 'Screening', notes: 'First reviewer' }),
      request(app)
        .patch(`/api/candidates/${candidateId}/stage`)
        .send({ currentStage: 'Applied', newStage: 'Interview', notes: 'Second reviewer' })
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 409]);

    const conflictRes = resA.status === 409 ? resA : resB;
    expect(conflictRes.body.success).toBe(false);
    expect(conflictRes.body.error.code).toBe('STALE_STATE');

    // Check DB state has only the winning transition
    const fresh = await Candidate.findById(candidateId);
    expect(fresh).not.toBeNull();
    expect(['Screening', 'Interview']).toContain(fresh!.stage);
    expect(fresh!.stageHistory).toHaveLength(2);
  });

  // =========================================================================
  // Test 3: Same-Stage Verification & Stale No-Op
  // =========================================================================
  it('Test 3: returns 200 no-op if DB matches currentStage; returns 409 STALE_STATE if DB already changed', async () => {
    const candidate = await Candidate.create({
      name: 'Rohan Verma',
      email: 'rohan@example.com',
      position: 'DevOps Engineer',
      experienceYears: 6,
      stage: 'Screening',
      stageHistory: [
        { from: null, to: 'Applied', changedAt: new Date() },
        { from: 'Applied', to: 'Screening', changedAt: new Date() }
      ]
    });

    const candidateId = candidate._id.toString();

    // 1. Genuine no-op: client submits Screening -> Screening, and DB is Screening
    const noOpRes = await request(app)
      .patch(`/api/candidates/${candidateId}/stage`)
      .send({ currentStage: 'Screening', newStage: 'Screening' });

    expect(noOpRes.status).toBe(200);
    expect(noOpRes.body.success).toBe(true);
    expect(noOpRes.body.data.stage).toBe('Screening');
    expect(noOpRes.body.data.stageHistory).toHaveLength(2); // No history appended

    // 2. Persisted state changed out-of-band to 'Interview'
    await Candidate.findByIdAndUpdate(candidateId, { $set: { stage: 'Interview' } });

    // Client still submits Screening -> Screening (client view was stale)
    const staleRes = await request(app)
      .patch(`/api/candidates/${candidateId}/stage`)
      .send({ currentStage: 'Screening', newStage: 'Screening' });

    expect(staleRes.status).toBe(409);
    expect(staleRes.body.success).toBe(false);
    expect(staleRes.body.error.code).toBe('STALE_STATE');
  });

  // =========================================================================
  // Test 4: ObjectId Validation Boundary Across Endpoints
  // =========================================================================
  it('Test 4: distinguishes 400 INVALID_ID from 404 CANDIDATE_NOT_FOUND across candidate endpoints', async () => {
    const invalidId = 'not-a-valid-24-hex-id';
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    // 1. GET /:id
    const getInvalid = await request(app).get(`/api/candidates/${invalidId}`);
    expect(getInvalid.status).toBe(400);
    expect(getInvalid.body.error.code).toBe('INVALID_ID');

    const getNotFound = await request(app).get(`/api/candidates/${nonExistentId}`);
    expect(getNotFound.status).toBe(404);
    expect(getNotFound.body.error.code).toBe('CANDIDATE_NOT_FOUND');

    // 2. PATCH /:id
    const patchInvalid = await request(app)
      .patch(`/api/candidates/${invalidId}`)
      .send({ position: 'Lead Architect' });
    expect(patchInvalid.status).toBe(400);
    expect(patchInvalid.body.error.code).toBe('INVALID_ID');

    const patchNotFound = await request(app)
      .patch(`/api/candidates/${nonExistentId}`)
      .send({ position: 'Lead Architect' });
    expect(patchNotFound.status).toBe(404);
    expect(patchNotFound.body.error.code).toBe('CANDIDATE_NOT_FOUND');

    // 3. PATCH /:id/stage
    const stageInvalid = await request(app)
      .patch(`/api/candidates/${invalidId}/stage`)
      .send({ currentStage: 'Applied', newStage: 'Screening' });
    expect(stageInvalid.status).toBe(400);
    expect(stageInvalid.body.error.code).toBe('INVALID_ID');

    const stageNotFound = await request(app)
      .patch(`/api/candidates/${nonExistentId}/stage`)
      .send({ currentStage: 'Applied', newStage: 'Screening' });
    expect(stageNotFound.status).toBe(404);
    expect(stageNotFound.body.error.code).toBe('CANDIDATE_NOT_FOUND');

    // 4. DELETE /:id
    const deleteInvalid = await request(app).delete(`/api/candidates/${invalidId}`);
    expect(deleteInvalid.status).toBe(400);
    expect(deleteInvalid.body.error.code).toBe('INVALID_ID');

    const deleteNotFound = await request(app).delete(`/api/candidates/${nonExistentId}`);
    expect(deleteNotFound.status).toBe(404);
    expect(deleteNotFound.body.error.code).toBe('CANDIDATE_NOT_FOUND');
  });

  // =========================================================================
  // Test 5: Dashboard Aggregation Invariant
  // =========================================================================
  it('Test 5: computes single-query facet aggregation, guarantees zero-filled stages, and satisfies mathematical invariants', async () => {
    // Seed varied candidate distributions (leaving 'Offer' at 0)
    await Candidate.create([
      { name: 'C1', email: 'c1@test.com', position: 'Eng', experienceYears: 2, stage: 'Applied' },
      { name: 'C2', email: 'c2@test.com', position: 'Eng', experienceYears: 3, stage: 'Applied' },
      { name: 'C3', email: 'c3@test.com', position: 'Eng', experienceYears: 1, stage: 'Screening' },
      { name: 'C4', email: 'c4@test.com', position: 'Eng', experienceYears: 4, stage: 'Interview' },
      { name: 'C5', email: 'c5@test.com', position: 'Eng', experienceYears: 5, stage: 'Interview' },
      { name: 'C6', email: 'c6@test.com', position: 'Eng', experienceYears: 2, stage: 'Hired' },
      { name: 'C7', email: 'c7@test.com', position: 'Eng', experienceYears: 6, stage: 'Rejected' }
    ]);

    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { total, activePipeline, interviewing, hired, rejected, stageCounts, recentCandidates } =
      res.body.data;

    // Invariant 1: Total count matches
    expect(total).toBe(7);
    expect(res.body.data.totalCandidates).toBe(7);
    expect(res.body.data.inInterview).toBe(2);

    // Invariant 2: All 6 stages exist with zero-filling
    expect(stageCounts.Applied).toBe(2);
    expect(stageCounts.Screening).toBe(1);
    expect(stageCounts.Interview).toBe(2);
    expect(stageCounts.Offer).toBe(0); // Zero-filled!
    expect(stageCounts.Hired).toBe(1);
    expect(stageCounts.Rejected).toBe(1);

    // Invariant 3: Total === sum of stage counts
    const sumStages = Object.values(stageCounts).reduce((acc: number, val: any) => acc + val, 0);
    expect(total).toBe(sumStages);

    // Invariant 4: Active pipeline calculation
    expect(activePipeline).toBe(
      stageCounts.Applied + stageCounts.Screening + stageCounts.Interview + stageCounts.Offer
    );
    expect(activePipeline).toBe(5);
    expect(activePipeline).toBe(total - (hired + rejected));

    // Invariant 5: Specific metrics
    expect(interviewing).toBe(2);
    expect(hired).toBe(1);
    expect(rejected).toBe(1);
    expect(recentCandidates).toHaveLength(5); // capped at recent 5
  });

  // =========================================================================
  // Test 6: Direct API Payload Validation Edge Cases
  // =========================================================================
  it('Test 6: enforces strict server-side Zod validation on direct API payloads', async () => {
    // 1. Missing required name
    const missingName = await request(app).post('/api/candidates').send({
      email: 'test@example.com',
      position: 'Engineer',
      experienceYears: 2
    });
    expect(missingName.status).toBe(400);
    expect(missingName.body.error.code).toBe('VALIDATION_ERROR');

    // 2. Malformed email address
    const malformedEmail = await request(app).post('/api/candidates').send({
      name: 'Test Candidate',
      email: 'not-an-email',
      position: 'Engineer',
      experienceYears: 2
    });
    expect(malformedEmail.status).toBe(400);

    // 3. Negative experience years
    const negativeExp = await request(app).post('/api/candidates').send({
      name: 'Test Candidate',
      email: 'neg@example.com',
      position: 'Engineer',
      experienceYears: -3
    });
    expect(negativeExp.status).toBe(400);

    // 4. Disallowed resume URL protocol (e.g. javascript:)
    const invalidResume = await request(app).post('/api/candidates').send({
      name: 'Test Candidate',
      email: 'proto@example.com',
      position: 'Engineer',
      experienceYears: 2,
      resumeUrl: 'javascript:alert(1)'
    });
    expect(invalidResume.status).toBe(400);
  });

  // =========================================================================
  // Test 7: 200-Candidate Capacity Limit Enforcement
  // =========================================================================
  it('Test 7: enforces the 200-candidate database cap with 422 CAPACITY_EXCEEDED', async () => {
    // Mock countDocuments to simulate 200 candidates
    const countSpy = vi.spyOn(Candidate, 'countDocuments').mockResolvedValue(200);

    const res = await request(app).post('/api/candidates').send({
      name: 'Over Capacity',
      email: 'over@example.com',
      position: 'Engineer',
      experienceYears: 3
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CAPACITY_EXCEEDED');

    countSpy.mockRestore();
  });

  // =========================================================================
  // Test 8: Parser Error Handling
  // =========================================================================
  it('Test 8: maps malformed JSON to 400 BAD_REQUEST', async () => {
    const res = await request(app)
      .post('/api/candidates')
      .set('Content-Type', 'application/json')
      .send('{ malformed json ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  // =========================================================================
  // Test 9: Recruiter Note & Feedback Composer
  // =========================================================================
  it('Test 9: appends recruiter feedback note to candidate audit trail', async () => {
    const candidate = await Candidate.create({
      name: 'Audit Trail Candidate',
      email: 'feedback@example.com',
      position: 'Backend Developer',
      experienceYears: 4,
      stage: 'Interview'
    });

    const res = await request(app)
      .post(`/api/candidates/${candidate._id}/notes`)
      .send({
        note: 'Candidate aced the systems design round with distributed lock analysis.',
        category: 'Technical Interview'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stageHistory.length).toBe(2);
    const latestEntry = res.body.data.stageHistory[1];
    expect(latestEntry.notes).toBe(
      '[Technical Interview] Candidate aced the systems design round with distributed lock analysis.'
    );
    expect(latestEntry.from).toBe('Interview');
    expect(latestEntry.to).toBe('Interview');
  });

  // =========================================================================
  // Test 10: Rating and Tags Support
  // =========================================================================
  it('Test 10: validates rating range (0-5) and supports tags in create and patch', async () => {
    // 1. Create with rating and tags
    const createRes = await request(app)
      .post('/api/candidates')
      .send({
        name: 'Top Talent Lead',
        email: 'toptalent@example.com',
        position: 'Full Stack Engineer',
        experienceYears: 6,
        rating: 5,
        tags: ['Top Talent', 'Referral']
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.rating).toBe(5);
    expect(createRes.body.data.tags).toEqual(['Top Talent', 'Referral']);

    // 2. Patch rating and tags
    const patchRes = await request(app)
      .patch(`/api/candidates/${createRes.body.data._id}`)
      .send({
        rating: 4,
        tags: ['Top Talent', 'Immediate Joiner']
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.rating).toBe(4);
    expect(patchRes.body.data.tags).toEqual(['Top Talent', 'Immediate Joiner']);

    // 3. Reject invalid rating (> 5)
    const invalidRatingRes = await request(app)
      .patch(`/api/candidates/${createRes.body.data._id}`)
      .send({
        rating: 6
      });

    expect(invalidRatingRes.status).toBe(400);
  });
});

