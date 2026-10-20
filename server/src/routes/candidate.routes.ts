import { Router } from 'express';
import { CandidateController } from '../controllers/candidate.controller.js';
import { validateObjectId } from '../middleware/validate-id.js';

const router = Router();

router.post('/', CandidateController.create);
router.get('/', CandidateController.list);

// ID-parameterized routes protected by validateObjectId
router.get('/:id', validateObjectId, CandidateController.getById);
router.patch('/:id', validateObjectId, CandidateController.update);
router.patch('/:id/stage', validateObjectId, CandidateController.updateStage);
router.delete('/:id', validateObjectId, CandidateController.delete);

export default router;
