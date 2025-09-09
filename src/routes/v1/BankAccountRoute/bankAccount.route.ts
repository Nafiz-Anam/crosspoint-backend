import express from "express";
import { bankAccountController } from "../../../controllers";
import { bankAccountValidation } from "../../../validations";
import auth from "../../../middlewares/auth";
import { validate } from "../../../middlewares/validate";
import {
  requirePermission,
  loadUserPermissions,
} from "../../../middlewares/permission";
import { Permission } from "@prisma/client";

const router = express.Router();

// Apply authentication and permission loading to all routes
router.use(auth());
router.use(loadUserPermissions);

router
  .route("/")
  .post(
    requirePermission(Permission.CREATE_BANK_ACCOUNT),
    validate(bankAccountValidation.createBankAccount.body, "body"),
    bankAccountController.createBankAccount
  )
  .get(
    requirePermission(Permission.READ_BANK_ACCOUNT),
    validate(bankAccountValidation.getBankAccounts.query, "query"),
    bankAccountController.getBankAccounts
  );

router
  .route("/active")
  .get(
    requirePermission(Permission.READ_BANK_ACCOUNT),
    bankAccountController.getActiveBankAccounts
  );

router
  .route("/:bankAccountId")
  .get(
    requirePermission(Permission.READ_BANK_ACCOUNT),
    validate(bankAccountValidation.getBankAccount.params, "params"),
    bankAccountController.getBankAccount
  )
  .patch(
    requirePermission(Permission.UPDATE_BANK_ACCOUNT),
    validate(bankAccountValidation.updateBankAccount.body, "body"),
    bankAccountController.updateBankAccount
  )
  .delete(
    requirePermission(Permission.DELETE_BANK_ACCOUNT),
    validate(bankAccountValidation.deleteBankAccount.params, "params"),
    bankAccountController.deleteBankAccount
  );

export default router;
