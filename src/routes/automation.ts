import { Router } from 'express';
import { runPlaywright } from '../controllers/AutoFillController';
import { runDelete } from '../controllers/FilterDeleteController';

const router = Router();

router.post('/run-playwright', runPlaywright);
router.post('/run-delete', runDelete);

export default router;
