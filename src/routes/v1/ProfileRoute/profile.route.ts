import express from "express";
import auth from "../../../middlewares/auth";
import { validate } from "../../../middlewares/validate";
import { profileValidation } from "../../../validations/profile.validation";
import profileController from "../../../controllers/profile.controller";

const router = express.Router();

// All routes require authentication
router.use(auth());

// Get my profile
router.get("/", profileController.getMyProfile);

// Update my profile
router.patch(
  "/",
  validate(profileValidation.updateProfile),
  profileController.updateMyProfile
);

// Change password
router.patch(
  "/change-password",
  validate(profileValidation.changePassword),
  profileController.changePassword
);

export default router;
