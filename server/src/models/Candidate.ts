import mongoose, { Document, Model, Schema } from 'mongoose';

export const HIRING_STAGES = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected'
] as const;

export type HiringStage = (typeof HIRING_STAGES)[number];

export interface IStageHistory {
  from: HiringStage | null;
  to: HiringStage;
  changedAt: Date;
  notes?: string;
}

export type ActivityType =
  | 'stage_changed'
  | 'note_added'
  | 'interview_scheduled'
  | 'resume_uploaded'
  | 'profile_updated';

export interface IActivityLog {
  type: ActivityType;
  title: string;
  description?: string;
  fromStage?: string | null;
  toStage?: string | null;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ICandidate {
  name: string;
  email: string;
  phone?: string;
  position: string;
  jobId?: mongoose.Types.ObjectId;
  headline?: string;
  summary?: string;
  location?: string;
  experienceYears: number;
  skills: string[];
  resumeUrl?: string;
  notes?: string;
  stage: HiringStage;
  stageHistory: IStageHistory[];
  activities?: IActivityLog[];
  rating?: number;
  tags?: string[];
  links?: any[];
  workExperience?: any[];
  education?: any[];
  projects?: any[];
  certifications?: any[];
  resumeMetadata?: any;
  parsingStatus?: 'uploaded' | 'needs_review' | 'ready' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ICandidateDocument extends ICandidate, Document {}

const StageHistorySchema = new Schema<IStageHistory>(
  {
    from: {
      type: String,
      enum: [...HIRING_STAGES, null],
      default: null
    },
    to: {
      type: String,
      enum: HIRING_STAGES,
      required: true
    },
    changedAt: {
      type: Date,
      default: () => new Date(),
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000
    }
  },
  { _id: false }
);

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    type: {
      type: String,
      enum: ['stage_changed', 'note_added', 'interview_scheduled', 'resume_uploaded', 'profile_updated'],
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, trim: true },
    fromStage: { type: String, default: null },
    toStage: { type: String, default: null },
    timestamp: { type: Date, default: () => new Date() },
    metadata: { type: Schema.Types.Mixed, default: null }
  },
  { _id: false }
);

const CandidateSchema = new Schema<ICandidateDocument>(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Candidate email is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      required: [true, 'Target position is required'],
      trim: true,
      minlength: [2, 'Position must be at least 2 characters'],
      maxlength: [100, 'Position must not exceed 100 characters']
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      default: null
    },
    experienceYears: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience cannot exceed 50 years']
    },
    skills: {
      type: [String],
      default: [],
      validate: [
        (val: string[]) => val.length <= 20,
        'Skills array cannot exceed 20 tags'
      ]
    },
    resumeUrl: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters']
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    stage: {
      type: String,
      enum: {
        values: HIRING_STAGES,
        message: '{VALUE} is not a valid hiring stage'
      },
      default: 'Applied',
      required: true
    },
    stageHistory: {
      type: [StageHistorySchema],
      default: () => [
        {
          from: null,
          to: 'Applied',
          changedAt: new Date(),
          notes: 'Initial application'
        }
      ]
    },
    activities: {
      type: [ActivityLogSchema],
      default: () => [
        {
          type: 'stage_changed',
          title: 'Candidate Registered',
          fromStage: null,
          toStage: 'Applied',
          timestamp: new Date(),
          description: 'Candidate registered in ATS'
        }
      ]
    },
    headline: { type: String, trim: true },
    summary: { type: String, trim: true, maxlength: 4000 },
    location: { type: String, trim: true },
    links: { type: [Schema.Types.Mixed], default: [] },
    workExperience: { type: [Schema.Types.Mixed], default: [] },
    education: { type: [Schema.Types.Mixed], default: [] },
    projects: { type: [Schema.Types.Mixed], default: [] },
    certifications: { type: [Schema.Types.Mixed], default: [] },
    resumeMetadata: { type: Schema.Types.Mixed, default: null },
    parsingStatus: {
      type: String,
      enum: ['uploaded', 'needs_review', 'ready', 'failed'],
      default: undefined
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Lean performance indexes
CandidateSchema.index({ email: 1 }, { unique: true });
CandidateSchema.index({ stage: 1, createdAt: -1 });
CandidateSchema.index({ createdAt: -1 });

export const Candidate: Model<ICandidateDocument> =
  mongoose.models.Candidate ||
  mongoose.model<ICandidateDocument>('Candidate', CandidateSchema);
