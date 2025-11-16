import express from "express";
import auth from "../../../middlewares/auth";
import {
  loadUserPermissions,
  requirePermission,
} from "../../../middlewares/permission";
import { addBranchFilter } from "../../../middlewares/branchFilter";
import { Permission } from "@prisma/client";
import { invoiceController } from "../../../controllers";
import { validate } from "../../../middlewares/validate";
import { invoiceValidation } from "../../../validations";

const router = express.Router();

// All routes require authentication and permission loading
router.use(auth());
router.use(loadUserPermissions);
router.use(addBranchFilter);

router
  .route("/")
  .post(
    requirePermission(Permission.CREATE_INVOICE),
    validate(invoiceValidation.createInvoice.body, "body"),
    invoiceController.createInvoice
  )
  .get(
    requirePermission(Permission.READ_INVOICE),
    validate(invoiceValidation.getInvoices.query, "query"),
    invoiceController.getInvoices
  );

router
  .route("/generate-number")
  .get(
    requirePermission(Permission.CREATE_INVOICE),
    invoiceController.generateInvoiceNumber
  );

router
  .route("/export-revenue-report")
  .get(
    requirePermission(Permission.READ_INVOICE),
    validate(invoiceValidation.getRevenueReport.query, "query"),
    invoiceController.exportRevenueReport
  );

// router
//   .route("/stats")
//   .get(
//     requirePermission(Permission.READ_INVOICE),
//     validate(invoiceValidation.getInvoiceStats.query, "query"),
//     invoiceController.getInvoiceStats
//   );

router
  .route("/:invoiceId")
  .get(
    requirePermission(Permission.READ_INVOICE),
    validate(invoiceValidation.getInvoice.params, "params"),
    invoiceController.getInvoice
  )
  .patch(
    requirePermission(Permission.UPDATE_INVOICE),
    validate(invoiceValidation.updateInvoice.body, "body"),
    invoiceController.updateInvoice
  )
  .delete(
    requirePermission(Permission.DELETE_INVOICE),
    validate(invoiceValidation.deleteInvoice.params, "params"),
    invoiceController.deleteInvoice
  );

router
  .route("/:invoiceId/status")
  .patch(
    requirePermission(Permission.UPDATE_INVOICE),
    validate(invoiceValidation.updateInvoiceStatus.params, "params"),
    validate(invoiceValidation.updateInvoiceStatus.body, "body"),
    invoiceController.updateInvoiceStatus
  );

router
  .route("/from-task/:taskId")
  .post(
    requirePermission(Permission.CREATE_INVOICE),
    invoiceController.createInvoiceFromTask
  );

router
  .route("/check-overdue")
  .post(
    requirePermission(Permission.READ_INVOICE),
    invoiceController.checkOverdueInvoices
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
 *               - branchId
 *               - employeeId
 *               - thanksMessage
 *               - items
 *             properties:
 *               clientId:
 *                 type: string
 *                 example: "uuid-client-id"
 *               branchId:
 *                 type: string
 *                 example: "uuid-branch-id"
 *               employeeId:
 *                 type: string
 *                 example: "uuid-employee-id"
 *               invoiceNumber:
 *                 type: string
 *                 example: "INV-202409-0001"
 *               thanksMessage:
 *                 type: string
 *                 example: "Thank you for your business"
 *               notes:
 *                 type: string
 *                 example: "Payment for September services"
 *               paymentTerms:
 *                 type: string
 *                 example: "Net 30 days"
 *               taxRate:
 *                 type: number
 *                 format: float
 *                 example: 10.5
 *               discountAmount:
 *                 type: number
 *                 format: float
 *                 example: 50.00
 *               paymentMethod:
 *                 type: string
 *                 example: "Internet Banking"
 *               bankName:
 *                 type: string
 *                 example: "City Bank"
 *               bankCountry:
 *                 type: string
 *                 example: "USA"
 *               bankIban:
 *                 type: string
 *                 example: "US29NWBK60161331926819"
 *               bankSwiftCode:
 *                 type: string
 *                 example: "NWBKUS33"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - serviceId
 *                     - description
 *                     - rate
 *                   properties:
 *                     serviceId:
 *                       type: string
 *                       example: "uuid-service-id"
 *                     description:
 *                       type: string
 *                       example: "Web Development Service"
 *                     rate:
 *                       type: number
 *                       format: float
 *                       example: 750.00
 *                     discount:
 *                       type: number
 *                       format: float
 *                       example: 50.00
 *     responses:
 *       201:
 *         description: Invoice created successfully
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
 *                   type: object
 *                   properties:
 *                     invoice:
 *                       $ref: '#/components/schemas/Invoice'
 *   get:
 *     summary: Get all invoices
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter by client ID
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Filter by branch ID
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filter by employee ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UNPAID, PAID, OVERDUE, CANCELLED]
 *         description: Filter by invoice status
 *       - in: query
 *         name: invoiceNumber
 *         schema:
 *           type: string
 *         description: Filter by invoice number
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *         description: Filter by invoice ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of invoices retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     invoices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Invoice'
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
 *         description: Invoice number generated successfully
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
 *                   example: Invoice number generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoiceNumber:
 *                       type: string
 *                       example: INV-202409-0001
 *
 * /invoices/stats:
 *   get:
 *     summary: Get invoice statistics
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Filter stats by branch ID
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filter stats by client ID
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filter stats by employee ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Invoice statistics retrieved successfully
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
 *                   example: Invoice statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalInvoices:
 *                           type: integer
 *                           example: 150
 *                         totalAmount:
 *                           type: number
 *                           format: float
 *                           example: 125000.50
 *                         subTotalAmount:
 *                           type: number
 *                           format: float
 *                           example: 115000.00
 *                         taxAmount:
 *                           type: number
 *                           format: float
 *                           example: 11500.50
 *                         discountAmount:
 *                           type: number
 *                           format: float
 *                           example: 1500.00
 *                         paidInvoices:
 *                           type: integer
 *                           example: 120
 *                         unpaidInvoices:
 *                           type: integer
 *                           example: 25
 *                         overdueInvoices:
 *                           type: integer
 *                           example: 5
 *                         statusBreakdown:
 *                           type: object
 *                           properties:
 *                             PAID:
 *                               type: integer
 *                               example: 120
 *                             UNPAID:
 *                               type: integer
 *                               example: 25
 *                             OVERDUE:
 *                               type: integer
 *                               example: 5
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
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
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
 *                   example: Invoice retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoice:
 *                       $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: Invoice not found
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
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Updated notes"
 *               thanksMessage:
 *                 type: string
 *                 example: "Updated thanks message"
 *               paymentTerms:
 *                 type: string
 *                 example: "Net 45 days"
 *               paymentMethod:
 *                 type: string
 *                 example: "Credit Card"
 *               bankName:
 *                 type: string
 *                 example: "Updated Bank"
 *               status:
 *                 type: string
 *                 enum: [UNPAID, PAID, OVERDUE, CANCELLED]
 *                 example: PAID
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Invoice not found
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
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 *       400:
 *         description: Cannot delete paid invoice
 *       404:
 *         description: Invoice not found
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
 *         description: Invoice ID
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
 *                 enum: [UNPAID, PAID, OVERDUE, CANCELLED]
 *                 example: PAID
 *     responses:
 *       200:
 *         description: Invoice status updated successfully
 *       400:
 *         description: Invalid status or validation error
 *       404:
 *         description: Invoice not found
 *
 * components:
 *   schemas:
 *     Invoice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "uuid-invoice-id"
 *         invoiceId:
 *           type: string
 *           example: "INV-BR001-20240902-001"
 *         clientId:
 *           type: string
 *           example: "uuid-client-id"
 *         branchId:
 *           type: string
 *           example: "uuid-branch-id"
 *         employeeId:
 *           type: string
 *           example: "uuid-employee-id"
 *         invoiceNumber:
 *           type: string
 *           example: "INV-202409-0001"
 *         totalAmount:
 *           type: number
 *           format: float
 *           example: 1725.00
 *         subTotalAmount:
 *           type: number
 *           format: float
 *           example: 1500.00
 *         discountAmount:
 *           type: number
 *           format: float
 *           example: 50.00
 *         taxAmount:
 *           type: number
 *           format: float
 *           example: 275.00
 *         taxRate:
 *           type: number
 *           format: float
 *           example: 10.5
 *         status:
 *           type: string
 *           enum: [UNPAID, PAID, OVERDUE, CANCELLED]
 *           example: UNPAID
 *         issuedDate:
 *           type: string
 *           format: date-time
 *           example: "2024-09-02T00:00:00.000Z"
 *         notes:
 *           type: string
 *           example: "Payment terms: Net 30 days"
 *         thanksMessage:
 *           type: string
 *           example: "Thank you for your business!"
 *         paymentTerms:
 *           type: string
 *           example: "Net 30 days"
 *         paymentMethod:
 *           type: string
 *           example: "Internet Banking"
 *         bankName:
 *           type: string
 *           example: "City Bank"
 *         bankCountry:
 *           type: string
 *           example: "USA"
 *         bankIban:
 *           type: string
 *           example: "US29NWBK60161331926819"
 *         bankSwiftCode:
 *           type: string
 *           example: "NWBKUS33"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-09-02T03:37:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-09-02T03:37:00.000Z"
 *         client:
 *           $ref: '#/components/schemas/Client'
 *         branch:
 *           $ref: '#/components/schemas/Branch'
 *         employee:
 *           $ref: '#/components/schemas/Employee'
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/InvoiceItem'
 *     InvoiceItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "uuid-item-id"
 *         invoiceId:
 *           type: string
 *           example: "uuid-invoice-id"
 *         serviceId:
 *           type: string
 *           example: "uuid-service-id"
 *         description:
 *           type: string
 *           example: "Web Development Service"
 *         rate:
 *           type: number
 *           format: float
 *           example: 750.00
 *         discount:
 *           type: number
 *           format: float
 *           example: 50.00
 *         total:
 *           type: number
 *           format: float
 *           example: 1450.00
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-09-02T03:37:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-09-02T03:37:00.000Z"
 *         service:
 *           $ref: '#/components/schemas/Service'
 */
