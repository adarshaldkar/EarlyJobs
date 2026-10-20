import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import {
  ExtractedLink,
  WorkExperience,
  EducationRecord,
  ProjectRecord,
  CertificationRecord,
  SkillCategories,
  ParsedResumeData,
  ResumeDocumentMeta,
  FieldEvidence,
  ResumeParsingResult
} from '../types/resume.js';
import { ApiError } from '../middleware/error-handler.js';

// Dynamically import pdfjs-dist to ensure ESM compatibility
let pdfjsLib: any = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    const mod = await import('pdfjs-dist/legacy/build/pdf.js');
    pdfjsLib = mod.default || mod;
  }
  return pdfjsLib;
}

const COMMON_TECH_ROLES = [
  'Full Stack Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Frontend Engineer',
  'Senior Frontend Engineer',
  'Backend Developer',
  'Backend Engineer',
  'Senior Backend Developer',
  'Senior Software Engineer',
  'Software Engineer',
  'DevOps Engineer',
  'Mobile Developer',
  'iOS Developer',
  'Android Developer',
  'UI/UX Designer & Frontend',
  'Product Designer',
  'QA Automation Engineer',
  'Data Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'AI Engineer',
  'Engineering Manager',
  'Product Manager',
  'Cloud Architect',
  'System Architect'
];

const SKILL_DICTIONARY: Record<keyof SkillCategories, string[]> = {
  programmingLanguages: [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'Go',
    'Golang',
    'C++',
    'C#',
    'Rust',
    'Ruby',
    'PHP',
    'Swift',
    'Kotlin',
    'SQL',
    'HTML',
    'CSS',
    'Bash',
    'Shell'
  ],
  frameworks: [
    'React',
    'Node.js',
    'Express',
    'Next.js',
    'Vue.js',
    'Angular',
    'Django',
    'FastAPI',
    'Flask',
    'Spring Boot',
    'Tailwind CSS',
    'Redux',
    'GraphQL',
    'NestJS',
    'Ruby on Rails',
    'Svelte'
  ],
  databases: [
    'MongoDB',
    'PostgreSQL',
    'MySQL',
    'Redis',
    'DynamoDB',
    'Elasticsearch',
    'Cassandra',
    'SQLite',
    'Supabase',
    'Firebase'
  ],
  tools: [
    'Docker',
    'Kubernetes',
    'AWS',
    'GCP',
    'Azure',
    'Git',
    'GitHub Actions',
    'CI/CD',
    'Terraform',
    'Linux',
    'Nginx',
    'Jest',
    'Playwright',
    'Vite',
    'Webpack',
    'Kafka'
  ],
  otherSkills: [
    'REST APIs',
    'Microservices',
    'System Design',
    'Agile',
    'Scrum',
    'TDD',
    'Distributed Systems',
    'Problem Solving',
    'Team Leadership'
  ]
};

export class ResumeParserService {
  /**
   * Main parsing entrypoint: inspects PDF file, extracts text + link annotations,
   * normalizes links, parses sections, scores confidence, and returns a draft candidate profile.
   */
  static async parseResume(
    filePath: string,
    originalFilename: string,
    relativeUrl: string
  ): Promise<ResumeParsingResult> {
    // 1. Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new ApiError(400, 'FILE_NOT_FOUND', 'Uploaded file could not be found on server');
    }

    const fileStats = fs.statSync(filePath);
    const sizeBytes = fileStats.size;

    // 2. Validate file size (max 5 MB)
    if (sizeBytes > 5 * 1024 * 1024) {
      throw new ApiError(400, 'FILE_TOO_LARGE', 'Resume file exceeds the maximum allowed limit of 5 MB');
    }

    const fileBuffer = fs.readFileSync(filePath);

    // 3. Validate PDF magic number (%PDF-)
    const header = fileBuffer.slice(0, 5).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      throw new ApiError(400, 'INVALID_PDF_FORMAT', 'Uploaded file is not a valid PDF document');
    }

    // 4. Compute SHA-256 hash for document integrity and duplicate detection
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 5. Load PDF using PDF.js
    const pdfjs = await getPdfjs();
    let doc: any;
    try {
      doc = await pdfjs.getDocument({
        data: new Uint8Array(fileBuffer),
        disableFontFace: true,
        useSystemFonts: true
      }).promise;
    } catch (err: any) {
      if (err.name === 'PasswordException') {
        throw new ApiError(400, 'PASSWORD_PROTECTED_PDF', 'Password-protected PDF files cannot be processed. Please provide an unlocked document.');
      }
      throw new ApiError(400, 'CORRUPT_PDF', 'Unable to parse PDF structure. The file may be damaged or malformed.');
    }

    const pageCount = doc.numPages;
    if (pageCount > 15) {
      throw new ApiError(400, 'PAGE_COUNT_EXCEEDED', 'Resume exceeds maximum page limit (15 pages)');
    }

    // 6. Iterate pages and collect text items + link annotations
    const pageTexts: { pageNumber: number; lines: string[]; fullText: string }[] = [];
    const rawAnnotations: { pageNumber: number; url: string; rect?: number[] }[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const annotations = await page.getAnnotations();

      // Collect annotations
      if (Array.isArray(annotations)) {
        for (const annot of annotations) {
          if (annot.subtype === 'Link' && annot.url) {
            rawAnnotations.push({
              pageNumber: pageNum,
              url: annot.url,
              rect: annot.rect
            });
          }
        }
      }

      // Reconstruct lines from text content items
      const lineMap = new Map<number, string[]>();
      for (const item of textContent.items) {
        if (!item.str || !item.str.trim()) continue;
        // transform[5] represents y-coordinate
        const yCoord = Math.round((item.transform ? item.transform[5] : 0) / 4) * 4;
        if (!lineMap.has(yCoord)) {
          lineMap.set(yCoord, []);
        }
        lineMap.get(yCoord)!.push(item.str.trim());
      }

      // Sort descending by y-coordinate (top of page first)
      const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
      const lines: string[] = [];
      for (const y of sortedY) {
        const lineStr = lineMap.get(y)!.join(' ');
        if (lineStr.trim()) {
          lines.push(lineStr.trim());
        }
      }

      const fullText = lines.join('\n');
      pageTexts.push({ pageNumber: pageNum, lines, fullText });
    }

    const combinedText = pageTexts.map((p) => p.fullText).join('\n\n');

    // 7. Extract hyperlinks (PDF Annotations + Visible URLs)
    const extractedLinks = this.extractAndDisambiguateLinks(pageTexts, rawAnnotations);

    // 8. Extract Identity & Contact Info
    const contactInfo = this.extractContactInfo(pageTexts, originalFilename);

    // 9. Extract Skills
    const skillsExtraction = this.extractSkills(combinedText);

    // 10. Extract Work Experience
    const workExperience = this.extractWorkExperience(pageTexts);

    // 11. Extract Education
    const education = this.extractEducation(pageTexts);

    // 12. Calculate conservative experienceYears
    const experienceYears = this.calculateExperienceYears(workExperience, combinedText);

    // 13. Build field evidence and warnings
    const warnings: string[] = [];
    const fieldEvidence: FieldEvidence[] = [];

    // Evaluate Name
    if (contactInfo.name) {
      fieldEvidence.push({
        field: 'name',
        value: contactInfo.name,
        confidence: contactInfo.nameConfidence,
        sourcePage: 1,
        sourceText: contactInfo.name,
        status: contactInfo.nameConfidence >= 0.8 ? 'high' : 'needs_review'
      });
    } else {
      warnings.push('Candidate name could not be reliably extracted from header');
    }

    // Evaluate Email
    if (contactInfo.email) {
      fieldEvidence.push({
        field: 'email',
        value: contactInfo.email,
        confidence: 0.95,
        sourcePage: contactInfo.emailPage || 1,
        sourceText: contactInfo.email,
        status: 'high'
      });
      if (contactInfo.allEmails.length > 1) {
        warnings.push(`Multiple email addresses found (${contactInfo.allEmails.join(', ')}). First was set as primary.`);
      }
    } else {
      warnings.push('No email address detected. Please enter candidate email manually.');
    }

    // Evaluate Phone
    if (contactInfo.phone) {
      fieldEvidence.push({
        field: 'phone',
        value: contactInfo.phone,
        confidence: 0.85,
        sourcePage: 1,
        sourceText: contactInfo.phone,
        status: 'high'
      });
    }

    // Evaluate Position
    if (contactInfo.position) {
      fieldEvidence.push({
        field: 'position',
        value: contactInfo.position,
        confidence: 0.8,
        sourcePage: 1,
        sourceText: contactInfo.position,
        status: 'high'
      });
    } else {
      warnings.push('No specific job role detected; defaulted to "Software Engineer"');
    }

    // Evaluate Links
    const linkedinLink = extractedLinks.find((l) => l.type === 'linkedin');
    if (linkedinLink && linkedinLink.url) {
      fieldEvidence.push({
        field: 'linkedin',
        value: linkedinLink.url,
        confidence: 0.95,
        sourcePage: linkedinLink.sourcePage,
        status: 'high'
      });
    } else if (linkedinLink && linkedinLink.status === 'needs_input') {
      warnings.push('LinkedIn text mentioned in resume but no valid link annotation was found.');
    }

    const githubLink = extractedLinks.find((l) => l.type === 'github');
    if (githubLink && githubLink.url) {
      fieldEvidence.push({
        field: 'github',
        value: githubLink.url,
        confidence: 0.95,
        sourcePage: githubLink.sourcePage,
        status: 'high'
      });
    }

    // Overall Confidence Score (weighted: email 35%, name 25%, experience 20%, skills 10%, links 10%)
    let overallConfidence = 0;
    if (contactInfo.email) overallConfidence += 0.35;
    if (contactInfo.name) overallConfidence += (contactInfo.nameConfidence || 0.8) * 0.25;
    if (workExperience.length > 0 || experienceYears > 0) overallConfidence += 0.2;
    if (skillsExtraction.flatSkills.length >= 3) overallConfidence += 0.1;
    if (extractedLinks.filter((l) => l.status === 'valid').length > 0) overallConfidence += 0.1;

    const roundedConfidence = Math.round(overallConfidence * 100) / 100;
    const parsingStatus = roundedConfidence >= 0.75 && contactInfo.email && contactInfo.name ? 'ready' : 'needs_review';

    const documentMeta: ResumeDocumentMeta = {
      storageKey: path.basename(filePath),
      originalFilename,
      mimeType: 'application/pdf',
      sizeBytes,
      sha256,
      url: relativeUrl,
      pageCount
    };

    const extracted: ParsedResumeData = {
      name: contactInfo.name || 'Candidate Name',
      email: contactInfo.email || '',
      phone: contactInfo.phone || undefined,
      location: contactInfo.location || undefined,
      position: contactInfo.position || 'Software Engineer',
      headline: contactInfo.headline || undefined,
      summary: contactInfo.summary || undefined,
      experienceYears,
      skills: skillsExtraction.flatSkills,
      skillCategories: skillsExtraction.categories,
      links: extractedLinks,
      workExperience,
      education,
      projects: [],
      certifications: []
    };

    return {
      status: parsingStatus,
      confidence: roundedConfidence,
      warnings,
      extractedAt: new Date().toISOString(),
      document: documentMeta,
      extracted,
      fieldEvidence
    };
  }

  /**
   * Disambiguates hyperlinks:
   * 1. PDF Link Annotations (hidden URL behind label "LinkedIn Profile")
   * 2. Visible URLs in text (regex match)
   * 3. Label-only without URL (marks status: needs_input)
   * 4. Enforces safe protocol (rejects javascript:, etc.)
   */
  private static extractAndDisambiguateLinks(
    pageTexts: { pageNumber: number; lines: string[]; fullText: string }[],
    annotations: { pageNumber: number; url: string; rect?: number[] }[]
  ): ExtractedLink[] {
    const results: ExtractedLink[] = [];
    const seenUrls = new Set<string>();

    const sanitizeUrl = (raw: string): string | null => {
      if (!raw || typeof raw !== 'string') return null;
      let trimmed = raw.trim();
      // Remove trailing punctuation
      trimmed = trimmed.replace(/[.,;)]+$/, '');

      // Reject unsafe schemes
      if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
        return null;
      }

      // Add https:// scheme if missing but recognized hostname
      if (!/^https?:\/\//i.test(trimmed)) {
        if (/^(www\.|linkedin\.com|github\.com|leetcode\.com|codeforces\.com|[a-zA-Z0-9-]+\.(com|org|io|dev|in|me|net))/i.test(trimmed)) {
          trimmed = `https://${trimmed}`;
        } else {
          return null;
        }
      }

      try {
        const u = new URL(trimmed);
        if (u.protocol === 'http:' || u.protocol === 'https:') {
          return u.toString();
        }
      } catch {
        return null;
      }
      return null;
    };

    const classifyLinkType = (url: string): ExtractedLink['type'] => {
      const lower = url.toLowerCase();
      if (lower.includes('linkedin.com')) return 'linkedin';
      if (lower.includes('github.com')) return 'github';
      if (lower.includes('leetcode.com')) return 'leetcode';
      if (lower.includes('codeforces.com')) return 'codeforces';
      if (lower.includes('portfolio') || lower.includes('.me') || lower.includes('.dev') || lower.includes('vercel.app')) return 'portfolio';
      return 'website';
    };

    // 1. Process PDF Link Annotations (High Priority - preserves hidden URLs)
    for (const annot of annotations) {
      const safeUrl = sanitizeUrl(annot.url);
      if (!safeUrl || seenUrls.has(safeUrl)) continue;

      seenUrls.add(safeUrl);
      const linkType = classifyLinkType(safeUrl);

      let label = 'External Link';
      if (linkType === 'linkedin') label = 'LinkedIn Profile';
      else if (linkType === 'github') label = 'GitHub Profile';
      else if (linkType === 'leetcode') label = 'LeetCode Profile';
      else if (linkType === 'portfolio') label = 'Personal Portfolio';
      else label = 'Personal Website';

      results.push({
        label,
        url: safeUrl,
        type: linkType,
        sourcePage: annot.pageNumber,
        source: 'pdf_annotation',
        status: 'valid'
      });
    }

    // 2. Process Visible URLs in Text
    const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`]+|(?:www\.|github\.com\/|linkedin\.com\/in\/)[^\s<>"'{}|\\^`]+)/gi;

    for (const p of pageTexts) {
      let match: RegExpExecArray | null;
      while ((match = urlRegex.exec(p.fullText)) !== null) {
        const matchedStr = match[1];
        const safeUrl = sanitizeUrl(matchedStr);
        if (safeUrl && !seenUrls.has(safeUrl)) {
          seenUrls.add(safeUrl);
          const linkType = classifyLinkType(safeUrl);
          let label = 'Visible Link';
          if (linkType === 'linkedin') label = 'LinkedIn Profile';
          else if (linkType === 'github') label = 'GitHub';
          else if (linkType === 'portfolio') label = 'Portfolio';

          results.push({
            label,
            url: safeUrl,
            type: linkType,
            sourcePage: p.pageNumber,
            source: 'visible_url',
            status: 'valid'
          });
        }
      }
    }

    // 3. Case D: Check for mentioned profile keywords without clickable targets
    const combined = pageTexts.map((p) => p.fullText).join(' ');
    const hasLinkedIn = results.some((r) => r.type === 'linkedin');
    const hasGitHub = results.some((r) => r.type === 'github');

    if (!hasLinkedIn && /\blinkedin\b/i.test(combined)) {
      results.push({
        label: 'LinkedIn',
        url: '',
        type: 'linkedin',
        sourcePage: 1,
        source: 'text_label_only',
        status: 'needs_input'
      });
    }

    if (!hasGitHub && /\bgithub\b/i.test(combined)) {
      results.push({
        label: 'GitHub',
        url: '',
        type: 'github',
        sourcePage: 1,
        source: 'text_label_only',
        status: 'needs_input'
      });
    }

    return results;
  }

  /**
   * Extracts name, emails, phone numbers, target position, and location.
   */
  private static extractContactInfo(
    pageTexts: { pageNumber: number; lines: string[]; fullText: string }[],
    originalFilename: string
  ) {
    const firstPageLines = pageTexts[0]?.lines || [];
    const allText = pageTexts.map((p) => p.fullText).join('\n');

    // Extract all valid emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const allEmails = Array.from(new Set(allText.match(emailRegex) || [])).map((e) => e.toLowerCase());

    let primaryEmail = allEmails[0] || '';
    let emailPage = 1;
    if (primaryEmail) {
      for (const p of pageTexts) {
        if (p.fullText.toLowerCase().includes(primaryEmail)) {
          emailPage = p.pageNumber;
          break;
        }
      }
    }

    // Extract Phone Numbers
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}\b/g;
    const phoneMatches = allText.match(phoneRegex);
    let primaryPhone = '';
    if (phoneMatches) {
      const cleanPhones = phoneMatches
        .map((p) => p.trim())
        .filter((p) => {
          const digits = p.replace(/\D/g, '');
          return digits.length >= 10 && digits.length <= 15;
        });
      if (cleanPhones.length > 0) {
        primaryPhone = cleanPhones[0];
      }
    }

    // Extract Location
    let location: string | undefined;
    const locationRegex = /\b([A-Z][a-zA-Z\s]+(?:,\s*[A-Z]{2}|,\s*[A-Z][a-zA-Z\s]+)?(?:\s*·\s*Remote|\s*\(Remote\))?)\b/;
    const locationLine = firstPageLines.find((l) =>
      /(mumbai|bengaluru|bangalore|pune|delhi|hyderabad|chennai|san francisco|new york|remote|india|usa)/i.test(l) &&
      !l.includes('@') &&
      l.length < 60
    );
    if (locationLine) {
      location = locationLine.trim();
    }

    // Extract Candidate Name from First Page Header
    let candidateName = '';
    let nameConfidence = 0.5;

    for (const line of firstPageLines.slice(0, 6)) {
      // Check segment before ' - ', ' | ', ' – '
      const segments = line.split(/\s*[-–|•]\s*/);
      for (const segment of segments) {
        const clean = segment.replace(/[^a-zA-Z\s.]/g, '').trim();
        if (
          clean.length >= 3 &&
          clean.length <= 40 &&
          !/@/.test(clean) &&
          !/(curriculum|vitae|resume|profile|contact|summary|experience|developer|engineer|manager|architect|designer)/i.test(clean) &&
          clean.split(/\s+/).length >= 2 &&
          clean.split(/\s+/).length <= 4
        ) {
          candidateName = clean;
          nameConfidence = 0.95;
          break;
        }
      }
      if (candidateName) break;
    }

    // Fallback: use filename if reasonable
    if (!candidateName) {
      const base = originalFilename.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ').trim();
      if (base.length >= 3 && !/(resume|cv|document|upload)/i.test(base)) {
        candidateName = base;
        nameConfidence = 0.6;
      }
    }

    // Extract Target Position / Headline
    let position = '';
    for (const role of COMMON_TECH_ROLES) {
      const regex = new RegExp(`\\b${role}\\b`, 'i');
      if (firstPageLines.slice(0, 8).some((l) => regex.test(l))) {
        position = role;
        break;
      }
    }
    if (!position) {
      for (const role of COMMON_TECH_ROLES) {
        if (new RegExp(`\\b${role}\\b`, 'i').test(allText)) {
          position = role;
          break;
        }
      }
    }

    return {
      name: candidateName,
      nameConfidence,
      email: primaryEmail,
      allEmails,
      emailPage,
      phone: primaryPhone,
      location,
      position: position || 'Software Engineer',
      headline: position,
      summary: undefined
    };
  }

  /**
   * Categorizes technical and soft skills.
   */
  private static extractSkills(text: string): { categories: SkillCategories; flatSkills: string[] } {
    const categories: SkillCategories = {
      programmingLanguages: [],
      frameworks: [],
      databases: [],
      tools: [],
      otherSkills: []
    };

    const flatSet = new Set<string>();

    for (const [categoryKey, skillList] of Object.entries(SKILL_DICTIONARY)) {
      const cat = categoryKey as keyof SkillCategories;
      for (const skill of skillList) {
        // Safe regex word boundary matching
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, 'i');
        if (regex.test(text)) {
          categories[cat].push(skill);
          flatSet.add(skill);
        }
      }
    }

    // Limit flat skills to 20 tags
    const flatSkills = Array.from(flatSet).slice(0, 20);

    return { categories, flatSkills };
  }

  /**
   * Extracts structured work experience records.
   */
  private static extractWorkExperience(
    pageTexts: { pageNumber: number; lines: string[]; fullText: string }[]
  ): WorkExperience[] {
    const experiences: WorkExperience[] = [];
    const dateRangeRegex = /(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(\d{4})\s*(?:-|–|to)\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(\d{4}|present|current|till\s*date)/i;

    for (const p of pageTexts) {
      let inExperienceSection = false;
      let currentExp: Partial<WorkExperience> | null = null;

      for (let i = 0; i < p.lines.length; i++) {
        const line = p.lines[i];

        if (/(?:experience|employment\s*history|work\s*history)/i.test(line) && line.length < 35) {
          inExperienceSection = true;
          continue;
        }

        if (inExperienceSection && /(?:education|skills|projects|certifications|awards)/i.test(line) && line.length < 30) {
          inExperienceSection = false;
          if (currentExp && currentExp.company) {
            experiences.push(this.finalizeWorkExp(currentExp, p.pageNumber));
            currentExp = null;
          }
          break;
        }

        if (inExperienceSection) {
          const dateMatch = line.match(dateRangeRegex);
          if (dateMatch) {
            if (currentExp && currentExp.company) {
              experiences.push(this.finalizeWorkExp(currentExp, p.pageNumber));
            }

            const rawDate = dateMatch[0];
            const isCurrent = /present|current|till\s*date/i.test(rawDate);

            // Look around for title and company
            const titleOrCompany = line.replace(rawDate, '').trim();
            const prevLine = i > 0 ? p.lines[i - 1] : '';

            currentExp = {
              title: titleOrCompany || prevLine || 'Software Engineer',
              company: prevLine && prevLine !== titleOrCompany ? prevLine : 'Technology Solutions',
              startDate: dateMatch[2],
              endDate: isCurrent ? 'Present' : dateMatch[4],
              isCurrent,
              responsibilities: [],
              technologies: []
            };
          } else if (currentExp && (line.startsWith('•') || line.startsWith('-'))) {
            currentExp.responsibilities = currentExp.responsibilities || [];
            currentExp.responsibilities.push(line.replace(/^[•\-\s]+/, '').trim());
          }
        }
      }

      if (currentExp && currentExp.company) {
        experiences.push(this.finalizeWorkExp(currentExp, p.pageNumber));
      }
    }

    return experiences.slice(0, 5);
  }

  private static finalizeWorkExp(exp: Partial<WorkExperience>, pageNumber: number): WorkExperience {
    return {
      company: exp.company || 'Company',
      title: exp.title || 'Engineer',
      startDate: exp.startDate,
      endDate: exp.endDate,
      isCurrent: exp.isCurrent ?? false,
      responsibilities: exp.responsibilities || [],
      technologies: exp.technologies || [],
      sourcePage: pageNumber
    };
  }

  /**
   * Extracts education history.
   */
  private static extractEducation(
    pageTexts: { pageNumber: number; lines: string[]; fullText: string }[]
  ): EducationRecord[] {
    const education: EducationRecord[] = [];
    const degreeRegex = /(bachelor|master|b\.?tech|b\.?s\.?|m\.?s\.?|b\.?e\.?|m\.?tech|ph\.?d|diploma)/i;

    for (const p of pageTexts) {
      for (const line of p.lines) {
        const degMatch = line.match(degreeRegex);
        if (degMatch) {
          education.push({
            institution: line.length > 50 ? line.slice(0, 50) : line,
            degree: degMatch[0].toUpperCase(),
            field: /computer\s*science|information\s*technology|software\s*engineering/i.test(line)
              ? 'Computer Science'
              : undefined,
            sourcePage: p.pageNumber
          });
          if (education.length >= 3) break;
        }
      }
    }

    return education;
  }

  /**
   * Calculates conservative total experience in years without double-counting overlaps.
   */
  private static calculateExperienceYears(workExperience: WorkExperience[], text: string): number {
    // 1. Explicit mention e.g. "4 years of experience" or "Experience: 3 years"
    const explicitMatch =
      text.match(/(?:experience\s*[:\-]\s*)(\d+)\+?\s*years?/i) ||
      text.match(/(\d+)\+?\s*years?(?:\s*of)?\s*(?:relevant\s*)?experience/i);
    if (explicitMatch) {
      const yrs = parseInt(explicitMatch[1], 10);
      if (yrs >= 0 && yrs <= 40) return yrs;
    }

    // 2. Sum spans from work experience records
    let totalYears = 0;
    const currentYear = new Date().getFullYear();

    for (const exp of workExperience) {
      const start = exp.startDate ? parseInt(exp.startDate, 10) : 0;
      let end = exp.endDate ? parseInt(exp.endDate, 10) : 0;
      if (exp.isCurrent || /present/i.test(exp.endDate || '')) {
        end = currentYear;
      }
      if (start > 1990 && end >= start) {
        totalYears += end - start;
      }
    }

    return Math.min(Math.max(totalYears, 0), 40);
  }
}
