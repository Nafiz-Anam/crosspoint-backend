import express from "express";
import auth from "../../middlewares/auth";
import {
  loadUserPermissions,
  requirePermission,
} from "../../middlewares/permission";
import { addBranchFilter } from "../../middlewares/branchFilter";
import { Permission } from "@prisma/client";
import { taskController } from "../../controllers";
import { validate } from "../../middlewares/validate";
import { taskValidation } from "../../validations";

const router = express.Router();

// All routes require authentication and permission loading
router.use(auth());
router.use(loadUserPermissions);
router.use(addBranchFilter);

router
  .route("/statistics")
  .get(
    requirePermission(Permission.READ_TASK),
    taskController.getTaskStatistics
  );

router
  .route("/")
  .post(
    requirePermission(Permission.CREATE_TASK),
    validate(taskValidation.createTask.body),
    taskController.createTask
  )
  .get(
    requirePermission(Permission.READ_TASK),
    validate(taskValidation.getTasks.query),
    taskController.getTasks
  );

// Specific routes must come before parameterized routes
router
  .route("/export-report")
  .get(
    requirePermission(Permission.READ_TASK),
    taskController.exportTaskReport
  );

router
  .route("/check-deadlines")
  .post(
    requirePermission(Permission.READ_TASK),
    taskController.checkTaskDeadlines
  );

router
  .route("/client/:clientId")
  .get(
    requirePermission(Permission.READ_TASK),
    validate(taskValidation.getTasksByClient.params, "params"),
    taskController.getTasksByClient
  );

router
  .route("/:taskId")
  .get(
    requirePermission(Permission.READ_TASK),
    validate(taskValidation.getTask.params, "params"),
    taskController.getTask
  )
  .patch(
    requirePermission(Permission.UPDATE_TASK),
    validate(taskValidation.updateTask.params, "params"),
    validate(taskValidation.updateTask.body),
    taskController.updateTask
  )
  .delete(
    requirePermission(Permission.DELETE_TASK),
    validate(taskValidation.deleteTask.params, "params"),
    taskController.deleteTask
  );

export default router;
