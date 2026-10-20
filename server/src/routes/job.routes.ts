import { Router } from 'express';
import { JobController } from '../controllers/job.controller.js';
import { validateObjectId } from '../middleware/validate-id.js';

const router = Router();

router.get('/', JobController.list);
router.post('/', JobController.create);
router.get('/:id', validateObjectId, JobController.getById);
router.patch('/:id', validateObjectId, JobController.update);
router.delete('/:id', validateObjectId, JobController.delete);

export default router;
