import express from "express";
import auth from "../../../middlewares/auth";
import { designationController } from "../../../controllers";

const router = express.Router();

router.post("/", auth(), designationController.createDesignation);
router.get("/", auth(), designationController.getDesignations);
router.get("/all", auth(), designationController.getAllDesignations);
router.get("/active", auth(), designationController.getActiveDesignations);
router.get("/:designationId", auth(), designationController.getDesignation);
router.put("/:designationId", auth(), designationController.updateDesignation);
router.delete("/:designationId", auth(), designationController.deleteDesignation);

export default router;
