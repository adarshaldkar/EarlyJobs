import { Request, Response, NextFunction } from 'express';
import { Interview } from '../models/Interview.js';
import { Candidate } from '../models/Candidate.js';
import { createInterviewSchema, updateInterviewSchema } from '../schemas/interview.schema.js';
import { ApiError } from '../middleware/error-handler.js';

export class InterviewController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const filter: any = {};
      if (status && status !== 'All') {
        filter.status = status;
      }

      const interviews = await Interview.find(filter).sort({ scheduledAt: 1 });
      res.status(200).json({
        success: true,
        data: interviews
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interview = await Interview.findById(req.params.id);
      if (!interview) {
        throw new ApiError(404, 'INTERVIEW_NOT_FOUND', 'Interview schedule not found');
      }
      res.status(200).json({
        success: true,
        data: interview
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createInterviewSchema.parse(req.body);
      const interview = await Interview.create(validated);

      // Log interview scheduling event to candidate's stage history and activities
      const candidate = await Candidate.findById(validated.candidateId);
      if (candidate) {
        candidate.stageHistory.push({
          from: candidate.stage,
          to: candidate.stage,
          changedAt: new Date(),
          notes: `[Interview Scheduled] ${validated.round} with ${validated.interviewer} at ${new Date(validated.scheduledAt).toLocaleString()}`
        });
        candidate.activities = candidate.activities || [];
        candidate.activities.push({
          type: 'interview_scheduled',
          title: `${validated.round} Scheduled`,
          description: `With ${validated.interviewer} on ${new Date(validated.scheduledAt).toLocaleString()}`,
          timestamp: new Date(),
          metadata: {
            round: validated.round,
            interviewer: validated.interviewer,
            scheduledAt: validated.scheduledAt
          }
        });
        await candidate.save();
      }

      res.status(201).json({
        success: true,
        data: interview
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateInterviewSchema.parse(req.body);
      const interview = await Interview.findByIdAndUpdate(req.params.id, validated, {
        new: true,
        runValidators: true
      });
      if (!interview) {
        throw new ApiError(404, 'INTERVIEW_NOT_FOUND', 'Interview schedule not found');
      }

      // If feedback was supplied, append to candidate stageHistory and activities
      if (validated.feedback) {
        const candidate = await Candidate.findById(interview.candidateId);
        if (candidate) {
          candidate.stageHistory.push({
            from: candidate.stage,
            to: candidate.stage,
            changedAt: new Date(),
            notes: `[${interview.round} Feedback] ${validated.feedback}${validated.rating ? ` (Rating: ${validated.rating}/5)` : ''}`
          });
          candidate.activities = candidate.activities || [];
          candidate.activities.push({
            type: 'note_added',
            title: `${interview.round} Feedback`,
            description: `${validated.feedback}${validated.rating ? ` (Rating: ${validated.rating}/5)` : ''}`,
            timestamp: new Date()
          });
          if (validated.rating && (!candidate.rating || candidate.rating === 0)) {
            candidate.rating = validated.rating;
          }
          await candidate.save();
        }
      }

      res.status(200).json({
        success: true,
        data: interview
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interview = await Interview.findByIdAndDelete(req.params.id);
      if (!interview) {
        throw new ApiError(404, 'INTERVIEW_NOT_FOUND', 'Interview schedule not found');
      }
      res.status(200).json({
        success: true,
        data: { deleted: true, id: req.params.id }
      });
    } catch (err) {
      next(err);
    }
  }
}
