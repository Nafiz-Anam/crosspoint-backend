import express from "express";
import auth from "../../../middlewares/auth";
import { validate } from "../../../middlewares/validate";
import { addBranchFilter } from "../../../middlewares/branchFilter";
import { attendanceValidation } from "../../../validations/attendance.validation";
import attendanceController from "../../../controllers/attendance.controller";

const router = express.Router();

// All routes require authentication
router.use(auth());
router.use(addBranchFilter);

// Employee endpoints (for their own attendance)
router
  .route("/check-in")
  .post(validate(attendanceValidation.checkIn), attendanceController.checkIn);

router
  .route("/check-out")
  .post(validate(attendanceValidation.checkOut), attendanceController.checkOut);

router
  .route("/my-attendance")
  .get(
    validate(attendanceValidation.getMyAttendance),
    attendanceController.getMyAttendance
  );

router
  .route("/my-attendance/range")
  .get(
    validate(attendanceValidation.getMyAttendanceRange),
    attendanceController.getMyAttendanceRange
  );

router
  .route("/my-attendance/stats")
  .get(
    validate(attendanceValidation.getMyAttendanceStats),
    attendanceController.getMyAttendanceStats
  );

// Attendance Report Routes
router
  .route("/report/:employeeId")
  .post(attendanceController.generateAttendanceReport);

router
  .route("/report-data/:employeeId")
  .post(attendanceController.getAttendanceReportData);

// HR/Admin endpoints (for managing attendance)
router
  .route("/branch/:branchId")
  .get(
    validate(attendanceValidation.getBranchAttendance),
    attendanceController.getBranchAttendance
  );

router
  .route("/branch/:branchId/today")
  .get(
    validate(attendanceValidation.getTodayBranchAttendance),
    attendanceController.getTodayBranchAttendance
  );

router
  .route("/branch/:branchId/stats")
  .get(
    validate(attendanceValidation.getBranchAttendanceStats),
    attendanceController.getBranchAttendanceStats
  );

router
  .route("/user/:userId")
  .get(
    validate(attendanceValidation.getEmployeeAttendance),
    attendanceController.getUserAttendance
  )
  .post(
    validate(attendanceValidation.markAttendance),
    attendanceController.markAttendance
  );

router
  .route("/user/:userId/range")
  .get(
    validate(attendanceValidation.getEmployeeAttendanceRange),
    attendanceController.getUserAttendanceRange
  );

router
  .route("/user/:userId/stats")
  .get(
    validate(attendanceValidation.getEmployeeAttendanceStats),
    attendanceController.getUserAttendanceStats
  );

export default router;

/**
 * @openapi
 * /attendance/check-in:
 *   post:
 *     summary: Employee check-in
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Arrived early for meeting"
 *     responses:
 *       200:
 *         description: Check-in successful
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
 *                   example: Check-in successful
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /attendance/check-out:
 *   post:
 *     summary: Employee check-out
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Left for doctor appointment"
 *     responses:
 *       200:
 *         description: Check-out successful
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
 *                   example: Check-out successful
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /attendance/my-attendance:
 *   get:
 *     summary: Get my attendance (today or by date)
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: My attendance
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
 *                   example: Attendance retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *
 * /attendance/my-attendance/range:
 *   get:
 *     summary: Get my attendance for a date range
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: My attendance range
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
 *                   example: Attendance range retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Attendance'
 *
 * /attendance/my-attendance/stats:
 *   get:
 *     summary: Get my attendance statistics
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: My attendance stats
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
 *                   example: Attendance stats retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalDays:
 *                       type: integer
 *                       example: 22
 *                     presentDays:
 *                       type: integer
 *                       example: 20
 *                     absentDays:
 *                       type: integer
 *                       example: 1
 *                     lateDays:
 *                       type: integer
 *                       example: 1
 *                     halfDays:
 *                       type: integer
 *                       example: 0
 *                     totalHours:
 *                       type: number
 *                       example: 176.5
 *                     averageHoursPerDay:
 *                       type: number
 *                       example: 8.02
 */
/**
 * @openapi
 * /attendance/branch/{branchId}:
 *   get:
 *     summary: Get branch attendance for a date range
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Branch attendance
 */
/**
 * @openapi
 * /attendance/branch/{branchId}/today:
 *   get:
 *     summary: Get today's branch attendance
 *     tags:
 *       - Attendance
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
 *         description: Today's branch attendance
 */
/**
 * @openapi
 * /attendance/branch/{branchId}/stats:
 *   get:
 *     summary: Get branch attendance statistics
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: branchId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Branch attendance stats
 */
/**
 * @openapi
 * /attendance/user/{userId}:
 *   get:
 *     summary: Get user attendance by date
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: User attendance
 */
/**
 * @openapi
 * /attendance/user/{userId}/range:
 *   get:
 *     summary: Get user attendance for a date range
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: User attendance range
 */
/**
 * @openapi
 * /attendance/user/{userId}/stats:
 *   get:
 *     summary: Get user attendance statistics
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: User attendance stats
 */
