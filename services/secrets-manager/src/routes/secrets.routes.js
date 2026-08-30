// routes/secrets.routes.js

import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { fetchSecrets } from '../controllers/secrets.controller.js';

const router = Router();


router.use(authenticate);


router.get('/:serviceName', fetchSecrets);

export default router;
