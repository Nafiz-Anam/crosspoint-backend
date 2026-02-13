import express from "express";
import auth from "../../../middlewares/auth";
import { leaveController } from "../../../controllers";

const router = express.Router();

// Leave Type Routes
router.post("/types", auth(), leaveController.createLeaveType);
router.get("/types", auth(), leaveController.getLeaveTypes);
router.get("/types/active", auth(), leaveController.getActiveLeaveTypes);
router.get("/types/:leaveTypeId", auth(), leaveController.getLeaveType);
router.put("/types/:leaveTypeId", auth(), leaveController.updateLeaveType);
router.delete("/types/:leaveTypeId", auth(), leaveController.deleteLeaveType);

// Leave Request Routes
router.post("/requests", auth(), leaveController.createLeaveRequest);
router.get("/requests", auth(), leaveController.getLeaveRequests);
router.get("/requests/:leaveRequestId", auth(), leaveController.getLeaveRequest);
router.put("/requests/:leaveRequestId/approve", auth(), leaveController.approveLeaveRequest);
router.put("/requests/:leaveRequestId/reject", auth(), leaveController.rejectLeaveRequest);
router.put("/requests/:leaveRequestId/cancel", auth(), leaveController.cancelLeaveRequest);

// Leave Balance Routes
router.get("/balance/:employeeId", auth(), leaveController.getEmployeeLeaveBalance);
router.post("/balance/initialize", auth(), leaveController.initializeLeaveBalance);

export default router;
