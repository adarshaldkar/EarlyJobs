import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJob {
  title: string;
  department: string;
  location: string;
  type: string;
  status: 'Open' | 'Closed' | 'Draft';
  experienceMin: number;
  experienceMax: number;
  openingsCount: number;
  description: string;
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobDocument extends IJob, Document {}

const JobSchema = new Schema<IJobDocument>(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      default: 'Engineering'
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      default: 'Bengaluru (Hybrid)'
    },
    type: {
      type: String,
      enum: ['Full-time', 'Contract', 'Part-time', 'Internship'],
      default: 'Full-time'
    },
    status: {
      type: String,
      enum: ['Open', 'Closed', 'Draft'],
      default: 'Open'
    },
    experienceMin: {
      type: Number,
      min: [0, 'Minimum experience cannot be negative'],
      default: 1
    },
    experienceMax: {
      type: Number,
      min: [0, 'Maximum experience cannot be negative'],
      default: 5
    },
    openingsCount: {
      type: Number,
      min: [1, 'Must have at least 1 opening'],
      default: 1
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    requirements: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        return ret;
      }
    }
  }
);

JobSchema.index({ status: 1, department: 1 });
JobSchema.index({ title: 1 });

export const Job: Model<IJobDocument> =
  mongoose.models.Job || mongoose.model<IJobDocument>('Job', JobSchema);
