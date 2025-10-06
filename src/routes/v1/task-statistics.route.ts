import express from "express";
import { taskController } from "../../controllers";
import auth from "../../middlewares/auth";
import { loadUserPermissions } from "../../middlewares/permission";

const router = express.Router();

// All routes require authentication and permission loading
router.use(auth());
router.use(loadUserPermissions);

// Add the statistics route - handles both employee and admin/manager/HR based on user role
router.route("/statistics").get(taskController.getTaskStatistics);

export default router;
