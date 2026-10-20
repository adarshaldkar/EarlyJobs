import { Request, Response, NextFunction } from 'express';
import { CandidateService } from '../services/candidate.service.js';
import {
  createCandidateSchema,
  updateCandidateSchema,
  updateStageSchema,
  queryCandidatesSchema,
  addNoteSchema
} from '../schemas/candidate.schema.js';

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
}
