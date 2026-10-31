import express from 'express';
import { createBuildValidator } from '../validators/createBuild.validator.js';
import { createBuildController } from '../controllers/createBuild.controller.js';

const router = express.Router();

router.post("/builds" , createBuildValidator, createBuildController )


export default router;