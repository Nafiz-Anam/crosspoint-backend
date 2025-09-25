import express from "express";
import { taskController } from "../../controllers";
import auth from "../../middlewares/auth";
import { loadUserPermissions } from "../../middlewares/permission";

const router = express.Router();

// All routes require authentication and permission loading
router.use(auth());
router.use(loadUserPermissions);

// Add the new statistics route
router.route("/statistics").get(taskController.getTaskStatistics);

export default router;
