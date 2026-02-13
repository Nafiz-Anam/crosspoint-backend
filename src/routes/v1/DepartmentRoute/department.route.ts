import express from "express";
import auth from "../../../middlewares/auth";
import { departmentController } from "../../../controllers";

const router = express.Router();

router.post("/", auth(), departmentController.createDepartment);
router.get("/", auth(), departmentController.getDepartments);
router.get("/all", auth(), departmentController.getAllDepartments);
router.get("/active", auth(), departmentController.getActiveDepartments);
router.get("/:departmentId", auth(), departmentController.getDepartment);
router.put("/:departmentId", auth(), departmentController.updateDepartment);
router.delete("/:departmentId", auth(), departmentController.deleteDepartment);

export default router;
