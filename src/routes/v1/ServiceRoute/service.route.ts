import express from "express";
import auth from "../../../middlewares/auth";
import {
  loadUserPermissions,
  requirePermission,
} from "../../../middlewares/permission";
import { addBranchFilter } from "../../../middlewares/branchFilter";
import { Permission } from "@prisma/client";
import { serviceController } from "../../../controllers";
import { validate } from "../../../middlewares/validate";
import { serviceValidation } from "../../../validations/service.validation";

const router = express.Router();

// All routes require authentication and permission loading
router.use(auth());
router.use(loadUserPermissions);
router.use(addBranchFilter);

router
  .route("/list/all")
  .get(
    requirePermission(Permission.READ_SERVICE),
    serviceController.getAllServices
  );

router
  .route("/")
  .post(
    requirePermission(Permission.CREATE_SERVICE),
    validate(serviceValidation.createService.body, "body"),
    serviceController.createService
  )
  .get(
    requirePermission(Permission.READ_SERVICE),
    serviceController.getServices
  );

router
  .route("/:serviceId")
  .get(
    requirePermission(Permission.READ_SERVICE),
    validate(serviceValidation.getService.params, "params"),
    serviceController.getService
  )
  .put(
    requirePermission(Permission.UPDATE_SERVICE),
    validate(serviceValidation.updateService.body, "body"),
    validate(serviceValidation.updateService.params, "params"),
    serviceController.updateService
  )
  .delete(
    requirePermission(Permission.DELETE_SERVICE),
    validate(serviceValidation.deleteService.params, "params"),
    serviceController.deleteService
  );

export default router;

/**
 * @openapi
 * /services:
 *   post:
 *     summary: Create a new service
 *     tags:
 *       - Services
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
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Consulting"
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 100.0
 *               description:
 *                 type: string
 *                 example: "Business consulting service"
 *     responses:
 *       201:
 *         description: Service created
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
 *                   example: Service created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get all services
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Consulting, Development, Design]
 *         description: Filter services by category
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter services by name
 *     responses:
 *       200:
 *         description: List of services
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
 *                   example: Services retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *
 * /services/{serviceId}:
 *   get:
 *     summary: Get service by ID
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service found
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
 *                   example: Service found
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Update service by ID
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
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
 *                 example: "Updated Service Name"
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 120.0
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *     responses:
 *       200:
 *         description: Service updated
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
 *                   example: Service updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete service by ID
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Service deleted
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
