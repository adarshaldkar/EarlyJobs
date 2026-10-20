import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  AlertCircle,
  Loader2,
  UploadCloud,
  FileText,
  Sparkles,
  User,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Globe,
  Plus,
  Trash2,
  ShieldCheck,
  Hash
} from 'lucide-react';
import { HIRING_STAGES, HiringStage, ExtractedLink, ResumeParsingResult } from '../../types';
import {
  createCandidate,
  parseCandidateResume,
  uploadCandidateResume,
  getApiErrorMessage
} from '../../lib/api';
import { useToast } from '../../components/Toast';

// Form validation schema matching backend constraints
const candidateFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  phone: z.string().trim().optional(),
  position: z.string().trim().min(2, 'Position must be at least 2 characters').max(100, 'Position cannot exceed 100 characters'),
  experienceYears: z
    .number({ invalid_type_error: 'Experience must be a number' })
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience cannot exceed 50 years'),
  skills: z.string().optional(),
  resumeUrl: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      if (val.startsWith('/uploads/')) return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'resumeUrl must be a valid http: or https: URL'),
  notes: z.string().trim().max(2000, 'Notes cannot exceed 2000 characters').optional(),
  rating: z.number().min(0).max(5).default(0),
  tags: z.string().optional(),
  stage: z.enum(HIRING_STAGES).default('Applied')
});

type FormData = z.infer<typeof candidateFormSchema>;

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow modes: 'manual' (Default Form) | 'parse' (Upload & Parse Resume Dropzone)
  const [mode, setMode] = useState<'parse' | 'manual'>('manual');

  // Parsing state
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ResumeParsingResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);

  // Editable parsed links during review
  const [reviewLinks, setReviewLinks] = useState<ExtractedLink[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      position: '',
      experienceYears: 0,
      skills: '',
      resumeUrl: '',
      notes: '',
      rating: 0,
      tags: '',
      stage: 'Applied'
    }
  });

  const handleClose = () => {
    setServerError(null);
    setSelectedResumeFile(null);
    setParseResult(null);
    setReviewLinks([]);
    setIsParsing(false);
    reset();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle PDF file selection and parsing
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setServerError('Only PDF documents are supported for automatic resume parsing.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setServerError('File size exceeds the 5 MB limit.');
      return;
    }

    try {
      setIsParsing(true);
      setServerError(null);
      setSelectedResumeFile(file);

      const result = await parseCandidateResume(file);
      setParseResult(result);

      // Pre-fill form values from extracted data for review
      setValue('name', result.extracted.name || '');
      setValue('email', result.extracted.email || '');
      setValue('phone', result.extracted.phone || '');
      setValue('position', result.extracted.position || 'Software Engineer');
      setValue('experienceYears', result.extracted.experienceYears || 0);
      setValue('skills', (result.extracted.skills || []).join(', '));
      setValue('resumeUrl', result.document.url);
      setValue('stage', 'Applied');

      // Initialize review links
      setReviewLinks(result.extracted.links || []);
      showToast('Resume parsed successfully! Please review extracted fields below.', 'success');
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      setServerError(msg || 'Failed to parse resume PDF. You may enter details manually.');
      showToast('Resume parsing error. Switched to manual entry.', 'warning');
      setMode('manual');
    } finally {
      setIsParsing(false);
    }
  };

  // Form submission (both manual and review confirmation)
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const parsedSkills = data.skills
        ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const parsedTags = data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      // Validated links from review
      const cleanLinks = reviewLinks
        .map((l) => ({
          ...l,
          url: l.url.trim()
        }))
        .filter((l) => l.url !== '');

      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        position: data.position,
        experienceYears: Number(data.experienceYears),
        skills: parsedSkills,
        resumeUrl: data.resumeUrl || (parseResult ? parseResult.document.url : undefined),
        notes: data.notes || undefined,
        rating: Number(data.rating) || 0,
        tags: parsedTags,
        stage: data.stage as HiringStage,
        links: cleanLinks,
        workExperience: parseResult?.extracted.workExperience || [],
        education: parseResult?.extracted.education || [],
        resumeMetadata: parseResult?.document || undefined,
        parsingStatus: parseResult?.status || undefined
      };

      const newCandidate = await createCandidate(payload);

      // If manual mode uploaded a direct file without parsing
      if (selectedResumeFile && !parseResult && newCandidate._id) {
        try {
          await uploadCandidateResume(newCandidate._id, selectedResumeFile);
        } catch {
          // Non-blocking attachment error
        }
      }

      showToast(`Candidate ${data.name} created and verified in ATS.`, 'success');
      handleClose();
      onSuccess();
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      if (err.response?.status === 409 || msg.toLowerCase().includes('already exists')) {
        setError('email', { message: 'A candidate with this email address already exists' });
        setServerError('A candidate with this email address already exists. Please review or update the existing profile.');
      } else {
        setServerError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLinkUrl = (index: number, newUrl: string) => {
    setReviewLinks((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        url: newUrl,
        status: newUrl.trim() ? 'valid' : 'needs_input'
      };
      return copy;
    });
  };

  const addCustomLink = () => {
    setReviewLinks((prev) => [
      ...prev,
      {
        label: 'Custom Link',
        url: '',
        type: 'other',
        sourcePage: 1,
        source: 'visible_url',
        status: 'needs_input'
      }
    ]);
  };

  const removeLink = (index: number) => {
    setReviewLinks((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="modal-title" className="text-sm font-bold text-slate-900 tracking-tight">
                Add Candidate to Pipeline
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                EarlyJobs ATS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingest PDF resumes with hyperlink extraction or enter applicant details manually.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workflow Mode Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center gap-2 bg-white">
          <button
            type="button"
            onClick={() => setMode('parse')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              mode === 'parse'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upload & Parse Resume (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              mode === 'manual'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mx-6 mt-3">
            <div
              data-testid="modal-error-banner"
              className="flex items-start gap-2.5 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{serverError}</div>
            </div>
          </div>
        )}

        {/* Hidden File Input for PDF Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {mode === 'parse' && !parseResult && !isParsing && (
            /* Upload Dropzone Screen */
            <div className="space-y-4 py-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-8 text-center transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  Select candidate PDF resume
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Upload PDF to extract contact details, LinkedIn/GitHub hyperlink annotations, and skills for recruiter verification.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20">
                  <FileText className="w-4 h-4" />
                  <span>Choose PDF Document</span>
                </div>
              </div>

              {/* Informational Feature Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="font-bold text-slate-900 block text-[11px] mb-0.5">🔗 Link Annotations</span>
                  <p className="text-[11px] text-slate-500">Preserves underlying URLs even when hidden behind text labels like "LinkedIn Profile".</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="font-bold text-slate-900 block text-[11px] mb-0.5">🛡️ Safety & SSRF Shield</span>
                  <p className="text-[11px] text-slate-500">Sanitizes URLs, blocks unsafe protocols, and prevents automatic network fetches.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="font-bold text-slate-900 block text-[11px] mb-0.5">🔍 Human Verification</span>
                  <p className="text-[11px] text-slate-500">Parsing generates a draft profile. Recruiter verifies all fields before candidate creation.</p>
                </div>
              </div>
            </div>
          )}

          {mode === 'parse' && isParsing && (
            /* Parsing Spinner Screen */
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Parsing Resume Document...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Extracting selectable text layout, PDF hyperlink annotations, contact metadata, and career history.
              </p>
            </div>
          )}

          {/* Form for both Review Workflow and Manual Entry */}
          {(mode === 'manual' || parseResult) && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Quick Resume Upload Banner inside the form when not parsed */}
              {!parseResult && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Auto-fill from Resume (PDF)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Extracts contact info, technical skills & clickable LinkedIn/GitHub hyperlinks
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 shrink-0">
                    Browse PDF
                  </span>
                </div>
              )}

              {/* Recruiter Review Banner (Shown when parsed) */}
              {parseResult && (
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Recruiter Review & Verification
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {Math.round(parseResult.confidence * 100)}% Extraction Confidence
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{parseResult.document.originalFilename}</span>
                      <span>·</span>
                      <span>{(parseResult.document.sizeBytes / 1024).toFixed(1)} KB</span>
                      <span>·</span>
                      <span>{parseResult.document.pageCount} page{parseResult.document.pageCount === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  {parseResult.warnings.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-indigo-100 text-[11px] text-amber-800">
                      {parseResult.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Core Candidate Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="field-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Candidate Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="field-name"
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Aarav Patel"
                    data-testid="input-name"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-rose-600 font-medium" data-testid="error-name">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="field-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="field-email"
                    type="email"
                    {...register('email')}
                    placeholder="candidate@example.com"
                    data-testid="input-email"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-rose-600 font-medium" data-testid="error-email">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="field-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="field-phone"
                    type="tel"
                    {...register('phone')}
                    placeholder="+91 98765 43210"
                    data-testid="input-phone"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
                </div>

                {/* Position */}
                <div>
                  <label htmlFor="field-position" className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Position <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="field-position"
                    type="text"
                    {...register('position')}
                    placeholder="e.g. Senior Full Stack Engineer"
                    data-testid="input-position"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                  {errors.position && (
                    <p className="mt-1 text-xs text-rose-600 font-medium" data-testid="error-position">
                      {errors.position.message}
                    </p>
                  )}
                </div>

                {/* Experience Years */}
                <div>
                  <label htmlFor="field-experience" className="block text-xs font-semibold text-slate-700 mb-1">
                    Experience (Years) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="field-experience"
                    type="number"
                    min={0}
                    max={50}
                    {...register('experienceYears', { valueAsNumber: true })}
                    data-testid="input-experience"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                  {errors.experienceYears && (
                    <p className="mt-1 text-xs text-rose-600 font-medium" data-testid="error-experience">
                      {errors.experienceYears.message}
                    </p>
                  )}
                </div>

                {/* Initial Hiring Stage */}
                <div>
                  <label htmlFor="field-stage" className="block text-xs font-semibold text-slate-700 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    id="field-stage"
                    {...register('stage')}
                    data-testid="input-stage"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  >
                    {HIRING_STAGES.map((stg) => (
                      <option key={stg} value={stg}>
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Candidate Rating */}
                <div>
                  <label htmlFor="field-rating" className="block text-xs font-semibold text-slate-700 mb-1">
                    Recruiter Initial Rating
                  </label>
                  <select
                    id="field-rating"
                    {...register('rating', { valueAsNumber: true })}
                    data-testid="input-rating"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  >
                    <option value={0}>0 - Unrated</option>
                    <option value={1}>1 - Below Expectations (★)</option>
                    <option value={2}>2 - Developing (★★)</option>
                    <option value={3}>3 - Solid Candidate (★★★)</option>
                    <option value={4}>4 - Strong Hire (★★★★)</option>
                    <option value={5}>5 - Exceptional / Top Talent (★★★★★)</option>
                  </select>
                </div>
              </div>

              {/* Extracted Professional Links & Profiles Section */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      Extracted Profiles & Hyperlinks
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Disambiguated PDF link annotations, visible URLs, and online profiles.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addCustomLink}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Profile Link</span>
                  </button>
                </div>

                {reviewLinks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No external profile links found in resume.</p>
                ) : (
                  <div className="space-y-2">
                    {reviewLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-[130px]">
                          <span className="font-bold text-slate-800">{link.label}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              link.source === 'pdf_annotation'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : link.source === 'text_label_only'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                            title={`Extracted via ${link.source}`}
                          >
                            {link.source === 'pdf_annotation'
                              ? 'PDF Annotation'
                              : link.source === 'text_label_only'
                              ? 'Needs URL'
                              : 'Visible URL'}
                          </span>
                        </div>

                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLinkUrl(idx, e.target.value)}
                          placeholder={link.type === 'linkedin' ? 'https://linkedin.com/in/...' : 'https://...'}
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />

                        <div className="flex items-center gap-1 shrink-0">
                          {link.url && (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                              title="Test link destination"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => removeLink(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Remove link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Input */}
              <div>
                <label htmlFor="field-skills" className="block text-xs font-semibold text-slate-700 mb-1">
                  Skills (comma-separated, max 20)
                </label>
                <input
                  id="field-skills"
                  type="text"
                  {...register('skills')}
                  placeholder="React, TypeScript, Node.js, MongoDB"
                  data-testid="input-skills"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
              </div>

              {/* Resume Document Link */}
              <div>
                <label htmlFor="field-resume-url" className="block text-xs font-semibold text-slate-700 mb-1">
                  Resume File / URL
                </label>
                <input
                  id="field-resume-url"
                  type="text"
                  {...register('resumeUrl')}
                  placeholder="https://... or uploaded file path"
                  data-testid="input-resume-url"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
                {errors.resumeUrl && (
                  <p className="mt-1 text-xs text-rose-600 font-medium" data-testid="error-resume-url">
                    {errors.resumeUrl.message}
                  </p>
                )}
              </div>

              {/* Recruiter Notes */}
              <div>
                <label htmlFor="field-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                  Recruiter Notes
                </label>
                <textarea
                  id="field-notes"
                  rows={2}
                  {...register('notes')}
                  placeholder="Initial recruiter notes, evaluation comments, etc."
                  data-testid="input-notes"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {parseResult ? (
                  <button
                    type="button"
                    onClick={() => {
                      setParseResult(null);
                      setSelectedResumeFile(null);
                      reset();
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    ← Choose Different File
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="submit-candidate-btn"
                    className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 rounded-xl shadow-sm shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Candidate...</span>
                      </>
                    ) : parseResult ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Create Candidate</span>
                      </>
                    ) : (
                      'Save Candidate'
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
