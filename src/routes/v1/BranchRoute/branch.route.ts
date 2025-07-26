import express from "express";
import auth from "../../../middlewares/auth";
import branchController from "../../../controllers/branch.controller";

const router = express.Router();

router.post("/", auth(), branchController.createBranch);
router.get("/", auth(), branchController.getAllBranches);
router.get("/:id", auth(), branchController.getBranchById);
router.get(
  "/branch-id/:branchId",
  auth(),
  branchController.getBranchByBranchId
);
router.put("/:id", auth(), branchController.updateBranch);
router.delete("/:id", auth(), branchController.deleteBranch);
router.get("/:id/statistics", auth(), branchController.getBranchStatistics);
router.get(
  "/with-statistics/all",
  auth(),
  branchController.getAllBranchesWithStatistics
);
router.get(
  "/:branchId/generate-employee-id",
  auth(),
  branchController.generateEmployeeId
);
router.get(
  "/:branchId/generate-customer-id",
  auth(),
  branchController.generateCustomerId
);
router.get(
  "/:branchId/generate-invoice-id",
  auth(),
  branchController.generateInvoiceId
);

export default router;

/**
 * @openapi
 * /branches:
 *   post:
 *     summary: Create a new branch
 *     tags:
 *       - Branches
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - city
 *               - postalCode
 *               - province
 *             properties:
 *               name:
 *                 type: string
 *                 example: Milan Central
 *               address:
 *                 type: string
 *                 example: Via Roma 123
 *               city:
 *                 type: string
 *                 example: Milano
 *               postalCode:
 *                 type: string
 *                 pattern: "^\\d{5}$"
 *                 example: "20100"
 *               province:
 *                 type: string
 *                 pattern: "^[A-Z]{2}$"
 *                 example: "MI"
 *               phone:
 *                 type: string
 *                 example: "+39 02 1234567"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: milan@company.it
 *     responses:
 *       201:
 *         description: Branch created
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
 *                   example: Branch created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get all branches
 *     tags:
 *       - Branches
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of branches
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
 *                   example: Branches retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Branch'
 *
 * /branches/{id}:
 *   get:
 *     summary: Get branch by ID
 *     tags:
 *       - Branches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Branch found
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
 *                   example: Branch found
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *       404:
 *         description: Branch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update branch by ID
 *     tags:
 *       - Branches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *                 example: Updated Branch Name
 *               phone:
 *                 type: string
 *                 example: "+39 02 7654321"
 *     responses:
 *       200:
 *         description: Branch updated
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
 *                   example: Branch updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Branch'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Branch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete branch by ID
 *     tags:
 *       - Branches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Branch deleted
 *       404:
 *         description: Branch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @openapi
 * /branches/branch-id/{branchId}:
 *   get:
 *     summary: Get branch by branchId
 *     tags:
 *       - Branches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Branch found
 */
/**
 * @openapi
 * /branches/{id}/statistics:
 *   get:
 *     summary: Get branch statistics
 *     tags:
 *       - Branches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Branch statistics
 */
/**
 * @openapi
 * /branches/with-statistics/all:
 *   get:
 *     summary: Get all branches with statistics
 *     tags:
 *       - Branches
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of branches with statistics
 */
/**
 * @openapi
 * /branches/{branchId}/generate-employee-id:
 *   get:
 *     summary: Generate employee ID for branch
 *     tags:
 *       - Branches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Generated employee ID
 * /branches/{branchId}/generate-customer-id:
 *   get:
 *     summary: Generate customer ID for branch
 *     tags:
 *       - Branches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Generated customer ID
 * /branches/{branchId}/generate-invoice-id:
 *   get:
 *     summary: Generate invoice ID for branch
 *     tags:
 *       - Branches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Generated invoice ID
 */
