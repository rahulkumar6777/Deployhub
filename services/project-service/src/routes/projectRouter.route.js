import { createProject } from "../controllers/createProject.controller.js";
import express from "express";
import { createProjectValidator, paymentInitValidator, paymentVerifyValidator } from "../validators/createProject.validators";
import { paymentInitController, paymentVerifyController } from "../controllers/payment.controller.js";


const router = express.Router();


router.route("/projects").post(createProjectValidator, createProject);
router.route('/payment/init').post(paymentInitValidator, paymentInitController);
router.route('/payment/verify').post(paymentVerifyValidator, paymentVerifyController);

export default router;
