import express from "express";
import auth from "../../../middlewares/auth";
import {
  loadUserPermissions,
  requirePermission,
} from "../../../middlewares/permission";
import { addBranchFilter } from "../../../middlewares/branchFilter";
import { Permission } from "@prisma/client";
import { clientController } from "../../../controllers";
import { validate } from "../../../middlewares/validate";
import { clientValidation } from "../../../validations";

const router = express.Router();

// All routes require authentication and permission loading
router.use(auth());
router.use(loadUserPermissions);
router.use(addBranchFilter);

router
  .route("/list/all")
  .get(
    requirePermission(Permission.READ_CLIENT),
    clientController.getAllClients
  );

router
  .route("/")
  .post(
    requirePermission(Permission.CREATE_CLIENT),
    validate(clientValidation.createClient.body),
    clientController.createClient
  )
  .get(
    requirePermission(Permission.READ_CLIENT),
    validate(clientValidation.getClients.query),
    clientController.getClients
  );

router
  .route("/:clientId")
  .get(
    requirePermission(Permission.READ_CLIENT),
    validate(clientValidation.getClient.params),
    clientController.getClient
  )
  .patch(
    requirePermission(Permission.UPDATE_CLIENT),
    validate(clientValidation.updateClient.body),
    clientController.updateClient
  )
  .delete(
    requirePermission(Permission.DELETE_CLIENT),
    validate(clientValidation.deleteClient.params),
    clientController.deleteClient
  );

export default router;

/**
 * @openapi
 * /clients:
 *   post:
 *     summary: Create a new client
 *     tags:
 *       - Clients
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
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Corporation
 *               email:
 *                 type: string
 *                 format: email
 *                 example: client@acme.com
 *               phone:
 *                 type: string
 *                 example: "+39 02 1234567"
 *               address:
 *                 type: string
 *                 example: "Via Roma 123, Milano"
 *               city:
 *                 type: string
 *                 example: "Milano"
 *               additionalPhone:
 *                 type: string
 *                 example: "+39 02 7654321"
 *               createdBy:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: Client created
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
 *                   example: Client created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get all clients
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
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
 *                   example: Clients retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *
 * /clients/{clientId}:
 *   get:
 *     summary: Get client by ID
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client found
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
 *                   example: Client found
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Update client by ID
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
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
 *                 example: Updated Client Name
 *               phone:
 *                 type: string
 *                 example: "+39 02 7654321"
 *     responses:
 *       200:
 *         description: Client updated
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
 *                   example: Client updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete client by ID
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Client deleted
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
