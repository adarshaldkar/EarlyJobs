import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';

export class DashboardController {
  static async getSummary(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const summary = await DashboardService.getSummary();

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }
}
