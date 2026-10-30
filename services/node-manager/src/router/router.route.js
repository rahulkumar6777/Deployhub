import express from 'express';
import { addRegionValidator, getRegionByIdValidator } from '../validators/region.validator.js';
import { addRegionController } from '../controllers/addregion.controller.js';
import { getRegionByIdController, getRegionsController } from '../controllers/getregion.controller.js';
import { nodeRegisterController } from '../controllers/nodeRegister.controller.js';
import { getNodeByIdValidator, getNodebyRegionCodeValidator,addNodeValidator, nodeVerifyValidator } from '../validators/node.validators.js';
import { getNodeByIdController, getNodebyRegionCodeController } from '../controllers/getNode.controller.js';
import { nodeVerifyController } from '../controllers/nodeverify.controller.js';

const router = express.Router();


router.get('/regions', getRegionsController);
router.get('/regions/:id', getRegionByIdValidator, getRegionByIdController);
router.post('/regions', addRegionValidator, addRegionController);
router.post('/nodes', addNodeValidator, nodeRegisterController);
router.post('/nodes/:id/verify', nodeVerifyValidator, nodeVerifyController);
router.get('/regions/:regioncode/nodes', getNodebyRegionCodeValidator, getNodebyRegionCodeController);
router.get('/nodes/:id', getNodeByIdValidator, getNodeByIdController);



export default router;