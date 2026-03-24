import { Router } from 'express';
import { runDelete, runPlaywright } from '../controllers/PlaywrightController';

const router = Router();

router.post('/run-playwright', runPlaywright);
router.post('/run-delete', runDelete);

export default router;
