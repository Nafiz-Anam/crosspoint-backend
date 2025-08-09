import express from "express";
import auth from "../../../middlewares/auth";
import {
  loadUserPermissions,
  requirePermission,
} from "../../../middlewares/permission";
import { Permission } from "@prisma/client";
import { employeeController } from "../../../controllers";
import { validate } from "../../../middlewares/validate";
import { employeeValidation } from "../../../validations";

const router = express.Router();

// All routes require authentication and permission loading
router.use(auth());
router.use(loadUserPermissions);

router
  .route("/")
  .post(
    requirePermission(Permission.CREATE_EMPLOYEE),
    validate(employeeValidation.createEmployee.body),
    employeeController.createEmployee
  )
  .get(
    requirePermission(Permission.READ_EMPLOYEE),
    employeeController.getEmployees
  );

router
  .route("/:employeeId")
  .get(
    requirePermission(Permission.READ_EMPLOYEE),
    employeeController.getEmployee
  )
  .patch(
    requirePermission(Permission.UPDATE_EMPLOYEE),
    employeeController.updateEmployee
  )
  .delete(
    requirePermission(Permission.DELETE_EMPLOYEE),
    employeeController.deleteEmployee
  );

export default router;

/**
 * @openapi
 * /employees:
 *   get:
 *     summary: Get all employees
 *     tags:
 *       - Employees
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees
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
 *                   example: Employees retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *   post:
 *     summary: Create a new employee (not exposed, use /hr or /employee)
 *     tags:
 *       - Employees
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 10
 *                 example: StrongPassw0rd!
 *               name:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [ADMIN, HR, EMPLOYEE]
 *                 example: EMPLOYEE
 *     responses:
 *       201:
 *         description: Employee created
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
 *                   example: Employee created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /employees/hr:
 *   post:
 *     summary: Create a new HR employee
 *     tags:
 *       - Employees
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - branchId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: hr@example.com
 *               password:
 *                 type: string
 *                 minLength: 10
 *                 example: StrongPassw0rd!
 *               name:
 *                 type: string
 *                 example: HR User
 *               branchId:
 *                 type: string
 *                 example: BR-001
 *     responses:
 *       201:
 *         description: HR employee created
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
 *                   example: HR employee created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /employees/employee:
 *   post:
 *     summary: Create a new employee user
 *     tags:
 *       - Employees
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - branchId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: employee@example.com
 *               password:
 *                 type: string
 *                 minLength: 10
 *                 example: StrongPassw0rd!
 *               name:
 *                 type: string
 *                 example: Employee User
 *               branchId:
 *                 type: string
 *                 example: BR-001
 *     responses:
 *       201:
 *         description: Employee user created
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
 *                   example: Employee user created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /employees/{employeeId}:
 *   get:
 *     summary: Get employee by ID
 *     tags:
 *       - Employees
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee found
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
 *                   example: Employee found
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Update employee by ID
 *     tags:
 *       - Employees
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
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
 *                 example: Updated Name
 *               password:
 *                 type: string
 *                 minLength: 10
 *                 example: NewStrongPassw0rd!
 *     responses:
 *       200:
 *         description: Employee updated
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
 *                   example: Employee updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete employee by ID
 *     tags:
 *       - Employees
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Employee deleted
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
