import express from "express";
import auth from "../../middlewares/auth";
import {
  loadUserPermissions,
  requirePermission,
} from "../../middlewares/permission";
import { Permission } from "@prisma/client";
import { taskController } from "../../controllers";
import { validate } from "../../middlewares/validate";
import { taskValidation } from "../../validations";

const router = express.Router();

// All routes require authentication and permission loading
router.use(auth());
router.use(loadUserPermissions);

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

router
  .route("/:taskId")
  .get(
    requirePermission(Permission.READ_TASK),
    validate(taskValidation.getTask.params),
    taskController.getTask
  )
  .patch(
    requirePermission(Permission.UPDATE_TASK),
    validate(taskValidation.updateTask.params),
    validate(taskValidation.updateTask.body),
    taskController.updateTask
  )
  .delete(
    requirePermission(Permission.DELETE_TASK),
    validate(taskValidation.deleteTask.params),
    taskController.deleteTask
  );

router
  .route("/client/:clientId")
  .get(
    requirePermission(Permission.READ_TASK),
    validate(taskValidation.getTasksByClient.params),
    taskController.getTasksByClient
  );

export default router;
