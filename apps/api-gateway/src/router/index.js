import express from 'express';
import identityroutes from './v1/identity.routes.js'
import projectRoutes from './v1/project.routes.js';
const router = express.Router({ caseSensitive: true, strict: true });

router.use('/v1/auth', identityroutes);
router.use('/v1/project', projectRoutes);

export default router