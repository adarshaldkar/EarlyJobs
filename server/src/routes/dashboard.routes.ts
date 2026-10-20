import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/summary', DashboardController.getSummary);

export default router;
