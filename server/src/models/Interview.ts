import mongoose, { Schema, Document, Model } from 'mongoose';

export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface IInterview {
  candidateId: mongoose.Types.ObjectId;
  candidateName: string;
  candidateEmail: string;
  position: string;
  round: string;
  interviewer: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingLink?: string;
  status: InterviewStatus;
  feedback?: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInterviewDocument extends IInterview, Document {}

const InterviewSchema = new Schema<IInterviewDocument>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: false
    },
    candidateName: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true
    },
    candidateEmail: {
      type: String,
      required: [true, 'Candidate email is required'],
      trim: true
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true
    },
    round: {
      type: String,
      required: [true, 'Interview round is required'],
      trim: true,
      default: 'Technical Interview'
    },
    interviewer: {
      type: String,
      required: [true, 'Interviewer name is required'],
      trim: true,
      default: 'Engineering Team Lead'
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date and time is required']
    },
    durationMinutes: {
      type: Number,
      default: 45
    },
    meetingLink: {
      type: String,
      default: 'https://meet.google.com/ej-interview-loop'
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled'
    },
    feedback: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 5
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

InterviewSchema.index({ scheduledAt: 1, status: 1 });
InterviewSchema.index({ candidateId: 1 });

export const Interview: Model<IInterviewDocument> =
  mongoose.models.Interview || mongoose.model<IInterviewDocument>('Interview', InterviewSchema);
