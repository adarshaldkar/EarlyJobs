export interface ExtractedLink {
  label: string;
  url: string;
  type: 'linkedin' | 'github' | 'portfolio' | 'website' | 'leetcode' | 'codeforces' | 'other';
  sourcePage: number;
  source: 'pdf_annotation' | 'visible_url' | 'text_label_only';
  status?: 'valid' | 'needs_input' | 'unverified';
}

export interface WorkExperience {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  responsibilities: string[];
  technologies: string[];
  sourcePage?: number;
}

export interface EducationRecord {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  sourcePage?: number;
}

export interface ProjectRecord {
  title: string;
  description?: string;
  technologies: string[];
  link?: string;
  repository?: string;
  sourcePage?: number;
}

export interface CertificationRecord {
  title: string;
  issuer?: string;
  issueDate?: string;
  credentialUrl?: string;
}

export interface SkillCategories {
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  otherSkills: string[];
}

export interface ParsedResumeData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  position: string;
  headline?: string;
  summary?: string;
  experienceYears: number;
  skills: string[];
  skillCategories: SkillCategories;
  links: ExtractedLink[];
  workExperience: WorkExperience[];
  education: EducationRecord[];
  projects: ProjectRecord[];
  certifications: CertificationRecord[];
}

export interface ResumeDocumentMeta {
  storageKey: string;
  originalFilename: string;
  mimeType: 'application/pdf';
  sizeBytes: number;
  sha256: string;
  url: string;
  pageCount: number;
}

export interface FieldEvidence {
  field: string;
  value: any;
  confidence: number;
  sourcePage: number;
  sourceText?: string;
  status: 'high' | 'needs_review' | 'low';
}

export interface ResumeParsingResult {
  status: 'ready' | 'needs_review' | 'failed';
  confidence: number;
  warnings: string[];
  extractedAt: string;
  document: ResumeDocumentMeta;
  extracted: ParsedResumeData;
  fieldEvidence: FieldEvidence[];
}
