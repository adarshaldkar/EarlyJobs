import { Request, Response, NextFunction } from 'express';
import { CandidateService } from '../services/candidate.service.js';
import {
  createCandidateSchema,
  updateCandidateSchema,
  updateStageSchema,
  queryCandidatesSchema,
  addNoteSchema
} from '../schemas/candidate.schema.js';
import { ApiError } from '../middleware/error-handler.js';

export class CandidateController {
  static async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validated = createCandidateSchema.parse(req.body);
      const candidate = await CandidateService.createCandidate(validated);

      res.status(201).json({
        success: true,
        data: candidate
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validated = queryCandidatesSchema.parse(req.query);
      const result = await CandidateService.listCandidates(validated);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const candidate = await CandidateService.getCandidateById(req.params.id);

      res.status(200).json({
        success: true,
        data: candidate
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validated = updateCandidateSchema.parse(req.body);
      const updated = await CandidateService.updateCandidate(
        req.params.id,
        validated
      );

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validated = updateStageSchema.parse(req.body);
      const updated = await CandidateService.updateCandidateStage(
        req.params.id,
        validated.currentStage,
        validated.newStage,
        validated.notes
      );

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async addNote(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validated = addNoteSchema.parse(req.body);
      const updated = await CandidateService.addNote(
        req.params.id,
        validated.note,
        validated.category
      );

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await CandidateService.deleteCandidate(req.params.id);

      res.status(200).json({
        success: true,
        data: {
          message: 'Candidate deleted successfully'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async uploadResume(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        throw new ApiError(400, 'NO_FILE_UPLOADED', 'Please select a resume file to upload');
      }

      const relativeUrl = `/uploads/resumes/${req.file.filename}`;
      const updated = await CandidateService.attachResume(
        req.params.id,
        relativeUrl,
        req.file.originalname,
        req.file.size
      );

      res.status(200).json({
        success: true,
        data: {
          candidate: updated,
          resumeUrl: relativeUrl,
          fileName: req.file.originalname,
          size: req.file.size
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
