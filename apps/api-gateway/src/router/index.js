import express from 'express';
import identityroutes from './v1/identity.routes.js'
const router = express.Router({ caseSensitive: true, strict: true });

router.use('/v1/auth', identityroutes);

export default router
