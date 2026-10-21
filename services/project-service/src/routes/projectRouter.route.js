import { createProject } from "../controllers/createProject.controller.js";
import express from "express";
import { createProjectValidator } from "../validators/createProject.validators";


const router = express.Router();


router.route("/projects").post(createProjectValidator, createProject);


export default router;
