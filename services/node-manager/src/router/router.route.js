import express from 'express';
import { addRegionValidator, getRegionByIdValidator } from '../validators/region.validator.js';
import { addRegionController } from '../controllers/addregion.controller.js';
import { getRegionByIdController, getRegionsController } from '../controllers/getregion.controller.js';
import { nodeRegisterController } from '../controllers/nodeRegister.controller.js';
import { getNodebyRegionCodeValidator } from '../validators/node.validators.js';
import { getNodebyRegionCodeController } from '../controllers/getNode.controller.js';

const router = express.Router();


router.get('/regions', getRegionsController);
router.get('/regions/:id', getRegionByIdValidator, getRegionByIdController);
router.post('/regions', addRegionValidator, addRegionController);
router.post('/nodes', nodeRegisterController);
router.get('/regions/:regioncode/nodes' , getNodebyRegionCodeValidator , getNodebyRegionCodeController)

export default router;