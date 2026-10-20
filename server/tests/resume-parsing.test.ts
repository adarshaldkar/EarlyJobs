import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import { createApp } from '../src/app.js';
import { Candidate } from '../src/models/Candidate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

describe('Resume Ingestion & Parsing Engine Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  const richPdfPath = path.join(FIXTURES_DIR, 'test_candidate_rich.pdf');
  const invalidTxtPath = path.join(FIXTURES_DIR, 'fake_resume.txt');

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Candidate.init();

    // Create fixtures directory if needed
    if (!fs.existsSync(FIXTURES_DIR)) {
      fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    }

    // 1. Generate a synthetic test PDF with text, contact info, and visible URLs
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    page.drawText('Adarsh Patel - Senior Full Stack Engineer', { x: 50, y: 750, size: 14 });
    page.drawText('Email: adarsh.engineer@example.com | Phone: +91 98765 43210', { x: 50, y: 720, size: 11 });
    page.drawText('LinkedIn Profile', { x: 50, y: 690, size: 11 });
    page.drawText('GitHub: github.com/adarsh-ats-dev', { x: 50, y: 660, size: 11 });
    page.drawText('Portfolio: https://adarsh-portfolio.dev', { x: 50, y: 630, size: 11 });
    page.drawText('Experience: 4 years | Skills: TypeScript, React, Node.js, PostgreSQL, Docker', { x: 50, y: 600, size: 11 });
    page.drawText('Education: Bachelor of Technology in Computer Science', { x: 50, y: 570, size: 11 });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(richPdfPath, pdfBytes);

    // 2. Generate a fake non-pdf file
    fs.writeFileSync(invalidTxtPath, 'This is plain text and not a PDF file.');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    // Clean up test fixtures
    if (fs.existsSync(richPdfPath)) fs.unlinkSync(richPdfPath);
    if (fs.existsSync(invalidTxtPath)) fs.unlinkSync(invalidTxtPath);
  });

  beforeEach(async () => {
    await Candidate.deleteMany({});
  });

  it('Test 1: successfully parses a valid PDF resume and extracts contact, skills, and links', async () => {
    const res = await request(app)
      .post('/api/candidates/parse-resume')
      .attach('resume', richPdfPath);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { document, extracted, fieldEvidence, status, confidence } = res.body.data;

    // Document metadata & SHA256 integrity
    expect(document.originalFilename).toBe('test_candidate_rich.pdf');
    expect(document.mimeType).toBe('application/pdf');
    expect(document.sha256).toBeDefined();
    expect(document.sha256).toHaveLength(64);
    expect(document.pageCount).toBe(1);

    // Extracted contact information
    expect(extracted.name).toBe('Adarsh Patel');
    expect(extracted.email).toBe('adarsh.engineer@example.com');
    expect(extracted.phone).toContain('98765');
    expect(extracted.position).toBe('Full Stack Engineer');
    expect(extracted.experienceYears).toBe(4);

    // Categorized skills
    expect(extracted.skills).toContain('TypeScript');
    expect(extracted.skills).toContain('React');
    expect(extracted.skills).toContain('Node.js');
    expect(extracted.skills).toContain('PostgreSQL');
    expect(extracted.skills).toContain('Docker');

    // Hyperlinks & profile extraction
    expect(extracted.links.length).toBeGreaterThanOrEqual(2);

    // Visible GitHub link normalized to https://
    const githubLink = extracted.links.find((l: any) => l.type === 'github');
    expect(githubLink).toBeDefined();
    expect(githubLink.url).toBe('https://github.com/adarsh-ats-dev');

    // Case D: LinkedIn text without URL annotation marked as needs_input
    const linkedinLink = extracted.links.find((l: any) => l.type === 'linkedin');
    expect(linkedinLink).toBeDefined();
    expect(linkedinLink.status).toBe('needs_input');

    // Overall confidence
    expect(confidence).toBeGreaterThan(0.7);
    expect(status).toBe('ready');
  });

  it('Test 2: rejects non-PDF file upload with 400 error and clear message', async () => {
    const res = await request(app)
      .post('/api/candidates/parse-resume')
      .attach('resume', invalidTxtPath);

    // Multer or service checks reject invalid document
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Test 3: rejects request without resume attachment with 400 NO_FILE_UPLOADED', async () => {
    const res = await request(app).post('/api/candidates/parse-resume');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe('NO_FILE_UPLOADED');
  });

  it('Test 4: completes review-and-save candidate creation with parsed links and resumeUrl', async () => {
    // 1. Parse resume
    const parseRes = await request(app)
      .post('/api/candidates/parse-resume')
      .attach('resume', richPdfPath);

    expect(parseRes.status).toBe(200);
    const parsedData = parseRes.body.data;

    // 2. Simulate recruiter review, inline edit (add LinkedIn URL), and confirmation
    const verifiedLinks = parsedData.extracted.links.map((l: any) => {
      if (l.type === 'linkedin') {
        return { ...l, url: 'https://linkedin.com/in/adarsh-patel-verified', status: 'valid' };
      }
      return l;
    });

    const createPayload = {
      name: parsedData.extracted.name,
      email: parsedData.extracted.email,
      phone: parsedData.extracted.phone,
      position: parsedData.extracted.position,
      experienceYears: parsedData.extracted.experienceYears,
      skills: parsedData.extracted.skills,
      resumeUrl: parsedData.document.url,
      stage: 'Applied',
      links: verifiedLinks,
      resumeMetadata: parsedData.document,
      parsingStatus: parsedData.status
    };

    const createRes = await request(app).post('/api/candidates').send(createPayload);
    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);

    const candidateId = createRes.body.data._id;
    expect(createRes.body.data.email).toBe('adarsh.engineer@example.com');
    expect(createRes.body.data.resumeUrl).toBe(parsedData.document.url);
    expect(createRes.body.data.links).toHaveLength(verifiedLinks.length);

    // 3. Verify retrieval preserves all structured fields
    const getRes = await request(app).get(`/api/candidates/${candidateId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.links[0].url).toBeDefined();
    expect(getRes.body.data.resumeUrl).toBe(parsedData.document.url);
  });
});
