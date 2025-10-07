import express from "express";
import auth from "../../../middlewares/auth";
import { dashboardController } from "../../../controllers";
import {
  loadUserPermissions,
  requirePermission,
} from "../../../middlewares/permission";
import { addBranchFilter } from "../../../middlewares/branchFilter";
import { Permission } from "@prisma/client";
import { validate } from "../../../middlewares/validate";
import { dashboardValidation } from "../../../validations";

const router = express.Router();

// All routes require authentication and permission loading
router.use(auth());
router.use(loadUserPermissions);
router.use(addBranchFilter);

// Dashboard statistics route
router
  .route("/stats")
  .get(
    requirePermission(Permission.VIEW_REPORTS),
    validate(dashboardValidation.getDashboardStats.query, "query"),
    dashboardController.getDashboardStats
  );

// Weekly earnings route
router
  .route("/weekly-earnings")
  .get(
    requirePermission(Permission.VIEW_REPORTS),
    validate(dashboardValidation.getWeeklyEarnings.query, "query"),
    dashboardController.getWeeklyEarnings
  );

// Earnings data route (supports week/month/year)
router
  .route("/earnings")
  .get(
    requirePermission(Permission.VIEW_REPORTS),
    validate(dashboardValidation.getEarningsData.query, "query"),
    dashboardController.getEarningsData
  );

// Invoice statistics route
router
  .route("/invoice-stats")
  .get(
    requirePermission(Permission.VIEW_REPORTS),
    validate(dashboardValidation.getInvoiceStats.query, "query"),
    dashboardController.getInvoiceStats
  );

export default router;
