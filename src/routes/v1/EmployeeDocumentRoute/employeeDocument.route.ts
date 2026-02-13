import express from "express";
import auth from "../../../middlewares/auth";
import { upload } from "../../../middlewares/upload";
import { employeeDocumentController } from "../../../controllers";

const router = express.Router();

// Specific routes first (before parameterized routes)
router.post("/:employeeId/upload", auth(), upload.single("file"), employeeDocumentController.uploadDocument);
router.get("/", auth(), employeeDocumentController.getDocuments);
router.get("/expiring", auth(), employeeDocumentController.getExpiringDocuments);
router.get("/employee/:employeeId", auth(), employeeDocumentController.getEmployeeDocuments);

// Parameterized routes last
router.get("/:documentId", auth(), employeeDocumentController.getDocument);
router.put("/:documentId", auth(), employeeDocumentController.updateDocument);
router.put("/:documentId/verify", auth(), employeeDocumentController.verifyDocument);
router.delete("/:documentId", auth(), employeeDocumentController.deleteDocument);

export default router;
