import express from 'express';
import { addRegionValidator, getRegionByIdValidator } from '../validators/region.validator.js';
import { addRegionController } from '../controllers/addregion.controller.js';
import { getRegionByIdController, getRegionsController } from '../controllers/getregion.controller.js';
import { nodeRegisterController } from '../controllers/nodeRegister.controller.js';
import { getNodeByIdValidator, getNodebyRegionCodeValidator, suggestNodeValidator, confirmNodeAllocationValidator } from '../validators/node.validators.js';
import { getNodeByIdController, getNodebyRegionCodeController } from '../controllers/getNode.controller.js';
import { nodeVerifyController } from '../controllers/nodeverify.controller.js';
import { suggestNodeController } from '../controllers/suggestNode.controller.js';
import { confirmNodeAllocationController } from '../controllers/nodeAllocation.controller.js';

const router = express.Router();


router.get('/regions', getRegionsController);
router.get('/regions/:id', getRegionByIdValidator, getRegionByIdController);
router.post('/regions', addRegionValidator, addRegionController);
router.post('/nodes', nodeRegisterController);
router.post('/nodes/:id/verify', nodeVerifyController);
router.post('/nodes/suggest', suggestNodeValidator, suggestNodeController);
router.post('/allocations/:allocationId/confirm', confirmNodeAllocationValidator, confirmNodeAllocationController);
router.get('/regions/:regioncode/nodes' , getNodebyRegionCodeValidator , getNodebyRegionCodeController);
router.get('/nodes/:id' , getNodeByIdValidator , getNodeByIdController)

export default router;
