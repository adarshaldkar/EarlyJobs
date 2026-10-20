import { Request, Response, NextFunction } from 'express';
import { Job } from '../models/Job.js';
import { Candidate } from '../models/Candidate.js';
import { createJobSchema, updateJobSchema, queryJobsSchema } from '../schemas/job.schema.js';
import { ApiError } from '../middleware/error-handler.js';

export class JobController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = queryJobsSchema.parse(req.query);
      const filter: any = {};

      if (query.status && query.status !== 'All') {
        filter.status = query.status;
      }
      if (query.department && query.department !== 'All') {
        filter.department = query.department;
      }
      if (query.search && query.search.trim()) {
        filter.title = new RegExp(query.search.trim(), 'i');
      }

      const jobs = await Job.find(filter).sort({ createdAt: -1 });

      // Compute applicant counts per job title
      const applicantCounts = await Candidate.aggregate([
        { $group: { _id: '$position', count: { $sum: 1 } } }
      ]);
      const countMap = new Map(applicantCounts.map((item) => [item._id, item.count]));

      const enrichedJobs = jobs.map((job) => {
        const obj = job.toJSON();
        return {
          ...obj,
          applicantCount: countMap.get(job.title) || 0
        };
      });

      res.status(200).json({
        success: true,
        data: enrichedJobs
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        throw new ApiError(404, 'JOB_NOT_FOUND', 'Job opening not found');
      }

      const candidates = await Candidate.find({ position: job.title }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: {
          ...job.toJSON(),
          applicantCount: candidates.length,
          candidates
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createJobSchema.parse(req.body);
      const job = await Job.create(validated);
      res.status(201).json({
        success: true,
        data: {
          ...job.toJSON(),
          applicantCount: 0
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateJobSchema.parse(req.body);
      const job = await Job.findByIdAndUpdate(req.params.id, validated, {
        new: true,
        runValidators: true
      });
      if (!job) {
        throw new ApiError(404, 'JOB_NOT_FOUND', 'Job opening not found');
      }
      res.status(200).json({
        success: true,
        data: job
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await Job.findByIdAndDelete(req.params.id);
      if (!job) {
        throw new ApiError(404, 'JOB_NOT_FOUND', 'Job opening not found');
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
