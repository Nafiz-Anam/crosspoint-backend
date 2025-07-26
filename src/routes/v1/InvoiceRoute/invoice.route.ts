import express from "express";
import auth from "../../../middlewares/auth";
import {
  loadUserPermissions,
  requirePermission,
} from "../../../middlewares/permission";
import { Permission } from "@prisma/client";
import { invoiceController } from "../../../controllers";
import { validate } from "../../../middlewares/validate";
import { invoiceValidation } from "../../../validations";

const router = express.Router();

// All routes require authentication and permission loading
router.use(auth());
router.use(loadUserPermissions);

router
  .route("/")
  .post(
    requirePermission(Permission.CREATE_INVOICE),
    validate(invoiceValidation.createInvoice.body),
    invoiceController.createInvoice
  )
  .get(
    requirePermission(Permission.READ_INVOICE),
    validate(invoiceValidation.getInvoices.query),
    invoiceController.getInvoices
  );

router
  .route("/generate-number")
  .get(
    requirePermission(Permission.CREATE_INVOICE),
    invoiceController.generateInvoiceNumber
  );

router
  .route("/:invoiceId")
  .get(
    requirePermission(Permission.READ_INVOICE),
    validate(invoiceValidation.getInvoice.params),
    invoiceController.getInvoice
  )
  .patch(
    requirePermission(Permission.UPDATE_INVOICE),
    validate(invoiceValidation.updateInvoice.body),
    invoiceController.updateInvoice
  )
  .delete(
    requirePermission(Permission.DELETE_INVOICE),
    validate(invoiceValidation.deleteInvoice.params),
    invoiceController.deleteInvoice
  );

router
  .route("/:invoiceId/status")
  .patch(
    requirePermission(Permission.UPDATE_INVOICE),
    validate(invoiceValidation.updateInvoiceStatus.body),
    invoiceController.updateInvoiceStatus
  );

export default router;

/**
 * @openapi
 * /invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - amount
 *               - dueDate
 *             properties:
 *               clientId:
 *                 type: string
 *                 example: CUST-BR001-001
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 1500.75
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *               notes:
 *                 type: string
 *                 example: "Payment for December services"
 *     responses:
 *       201:
 *         description: Invoice created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Invoice created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get all invoices
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Invoices retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
 *
 * /invoices/generate-number:
 *   get:
 *     summary: Generate invoice number
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Generated invoice number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceNumber:
 *                   type: string
 *                   example: INV-BR001-20241225-001
 *
 * /invoices/{invoiceId}:
 *   get:
 *     summary: Get invoice by ID
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Invoice found
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: Invoice not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Update invoice by ID
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 2000.00
 *               notes:
 *                 type: string
 *                 example: "Updated invoice notes"
 *     responses:
 *       200:
 *         description: Invoice updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Invoice updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Invoice not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete invoice by ID
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Invoice deleted
 *       404:
 *         description: Invoice not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /invoices/{invoiceId}/status:
 *   patch:
 *     summary: Update invoice status
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PAID, OVERDUE, CANCELLED]
 *                 example: PAID
 *     responses:
 *       200:
 *         description: Invoice status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Invoice status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Invoice not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
