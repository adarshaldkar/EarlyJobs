import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller.js';
import { validateObjectId } from '../middleware/validate-id.js';

const router = Router();

router.get('/', InterviewController.list);
router.post('/', InterviewController.create);
router.get('/:id', validateObjectId, InterviewController.getById);
router.patch('/:id', validateObjectId, InterviewController.update);
router.delete('/:id', validateObjectId, InterviewController.delete);

export default router;
