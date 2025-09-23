import express from "express";
import auth from "../../../middlewares/auth";
import { validate } from "../../../middlewares/validate";
import { companyInfoValidation } from "../../../validations/companyInfo.validation";
import companyInfoController from "../../../controllers/companyInfo.controller";
import { upload } from "../../../middlewares/upload";

const router = express.Router();

// All routes require authentication
router.use(auth());

// Company Info Routes
router
  .route("/")
  .get(companyInfoController.getCompanyInfo)
  .put(
    validate(companyInfoValidation.updateCompanyInfo),
    companyInfoController.updateCompanyInfo
  );

router
  .route("/logo")
  .post(upload.single("logo"), companyInfoController.uploadLogo);

export default router;
