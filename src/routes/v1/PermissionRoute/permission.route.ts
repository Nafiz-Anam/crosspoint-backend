import express from "express";
import { validate } from "../../../middlewares/validate";
import auth from "../../../middlewares/auth";
import {
  loadUserPermissions,
  requirePermission,
} from "../../../middlewares/permission";
import { Permission } from "@prisma/client";
import { permissionController } from "../../../controllers";

const router = express.Router();

// All routes require authentication and permission loading
router.use(auth());
router.use(loadUserPermissions);

// Only ADMIN and HR can manage permissions
router.post(
  "/assign",
  requirePermission(Permission.ASSIGN_PERMISSIONS),
  permissionController.assignPermissions
);

router.post(
  "/revoke",
  requirePermission(Permission.ASSIGN_PERMISSIONS),
  permissionController.revokePermissions
);

// Get user permissions
router.get(
  "/user/:userId",
  requirePermission(Permission.MANAGE_USERS),
  permissionController.getUserPermissions
);

// Get all available permissions
router.get(
  "/all",
  requirePermission(Permission.MANAGE_USERS),
  permissionController.getAllPermissions
);

// Check if user has specific permission
router.get(
  "/check/:userId/:permission",
  requirePermission(Permission.MANAGE_USERS),
  permissionController.checkPermission
);

export default router;

/**
 * @openapi
 * /permissions/assign:
 *   post:
 *     summary: Assign permissions to a user
 *     tags:
 *       - Permissions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - permissions
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "user-uuid-123"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: READ_USER
 *     responses:
 *       200:
 *         description: Permissions assigned
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
 *                   example: Permissions assigned successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /permissions/revoke:
 *   post:
 *     summary: Revoke permissions from a user
 *     tags:
 *       - Permissions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - permissions
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "user-uuid-123"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: READ_USER
 *     responses:
 *       200:
 *         description: Permissions revoked
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
 *                   example: Permissions revoked successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /permissions/user/{userId}:
 *   get:
 *     summary: Get permissions for a user
 *     tags:
 *       - Permissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User permissions
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
 *                   example: User permissions retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: READ_USER
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /permissions/all:
 *   get:
 *     summary: Get all available permissions
 *     tags:
 *       - Permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
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
 *                   example: Permissions retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: READ_USER
 *
 * /permissions/check/{userId}/{permission}:
 *   get:
 *     summary: Check if user has a specific permission
 *     tags:
 *       - Permissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permission
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission check result
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
 *                   example: User has permission
 *                 data:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
