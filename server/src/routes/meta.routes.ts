import { Router } from 'express';
import { MetaController } from '../controllers/meta.controller.js';

const router = Router();

router.get('/stages', MetaController.getStages);

export default router;
