import React, { useEffect } from 'react';
import { X, Download, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { Candidate } from '../types';

interface ResumePreviewModalProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
}

export const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  candidate,
  isOpen,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resumeUrl = candidate.resumeUrl || '';
  const isLocalUpload = resumeUrl.startsWith('/uploads/');
  const fullResumeUrl = isLocalUpload
    ? `${import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : ''}${resumeUrl}`
    : resumeUrl;

  const displayFilename = resumeUrl
    ? resumeUrl.split('/').pop()?.split('?')[0] || `${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`
    : `${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[85vh] bg-surface rounded-lg shadow-2xl border border-subtle flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-subtle bg-canvas">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="resume-modal-title"
                className="text-sm font-semibold text-ink-primary truncate flex items-center gap-2"
              >
                <span>{displayFilename}</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified Candidate
                </span>
              </h2>
              <p className="text-xs text-ink-tertiary truncate">
                {candidate.name} · {candidate.position} ({candidate.experienceYears}y exp)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fullResumeUrl && (
              <>
                <a
                  href={fullResumeUrl}
                  download={displayFilename}
                  className="px-3 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary bg-surface hover:bg-stone-100 border border-subtle rounded flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <a
                  href={fullResumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary bg-surface hover:bg-stone-100 border border-subtle rounded flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Tab</span>
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-ink-tertiary hover:text-ink-primary hover:bg-stone-100 rounded transition-colors"
              aria-label="Close resume preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Document Previewer */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-stone-100">
          {/* Main Document Viewer Frame */}
          <div className="flex-1 flex flex-col min-h-0 p-3">
            {fullResumeUrl ? (
              <iframe
                src={fullResumeUrl}
                title={`Resume of ${candidate.name}`}
                className="w-full h-full rounded border border-subtle bg-white shadow-xs"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface rounded border border-subtle text-center">
                <FileText className="w-12 h-12 text-stone-300 mb-3" />
                <h3 className="text-sm font-semibold text-ink-primary">No Document Uploaded</h3>
                <p className="text-xs text-ink-tertiary max-w-sm mt-1">
                  This candidate currently does not have an attached PDF resume. You can upload one from the candidate dossier.
                </p>
              </div>
            )}
          </div>

          {/* Dossier Side Summary */}
          <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-subtle bg-surface p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">
                Candidate Profile
              </span>
              <h3 className="text-sm font-semibold text-ink-primary mt-1">{candidate.name}</h3>
              <p className="text-xs text-ink-secondary">{candidate.position}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-subtle">
                <span className="text-ink-tertiary">Current Stage</span>
                <span className="font-medium text-ink-primary">{candidate.stage}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-subtle">
                <span className="text-ink-tertiary">Experience</span>
                <span className="font-medium text-ink-primary">{candidate.experienceYears} Years</span>
              </div>
              <div className="flex justify-between py-1 border-b border-subtle">
                <span className="text-ink-tertiary">Email</span>
                <span className="font-medium text-ink-primary truncate max-w-[140px]" title={candidate.email}>
                  {candidate.email}
                </span>
              </div>
              {candidate.phone && (
                <div className="flex justify-between py-1 border-b border-subtle">
                  <span className="text-ink-tertiary">Phone</span>
                  <span className="font-medium text-ink-primary">{candidate.phone}</span>
                </div>
              )}
            </div>

            {candidate.skills && candidate.skills.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">
                  Tagged Skills
                </span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {candidate.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200 text-[11px]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto pt-3 border-t border-subtle text-[11px] text-ink-tertiary flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Document stored in EarlyJobs ATS storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
