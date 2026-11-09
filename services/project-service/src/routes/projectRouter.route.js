import { createProject } from "../controllers/users/createProject.controller.js";
import express from "express";
import { createProjectValidator, paymentInitValidator, paymentVerifyValidator } from "../validators/createProject.validators.js";
import { paymentInitController, paymentVerifyController } from "../controllers/users/payment.controller.js";
import { getProjectValidator } from "../validators/getProject.validator.js";
import { getProjectController } from "../controllers/for-internal-service/getProject.controller.js";


const router = express.Router();


router.route("/").post(createProjectValidator, createProject).get(getProjectValidator, getProjectController)
router.route('/payment/init').post(paymentInitValidator, paymentInitController);
router.route('/payment/verify').post(paymentVerifyValidator, paymentVerifyController);


export default router;
