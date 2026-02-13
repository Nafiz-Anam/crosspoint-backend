import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { leaveService } from "../services";
import sendResponse from "../utils/responseHandler";
import { LeaveRequestStatus } from "@prisma/client";

// ========== Leave Type Controllers ==========

const createLeaveType = catchAsync(async (req, res) => {
  const { name, code, description, maxDays, isPaid, isActive } = req.body;

  if (!name || !code) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Leave type name and code are required");
  }

  const leaveType = await leaveService.createLeaveType({
    name,
    code,
    description,
    maxDays,
    isPaid,
    isActive,
  });

  sendResponse(res, httpStatus.CREATED, true, { leaveType }, "Leave type created successfully");
});

const getLeaveTypes = catchAsync(async (req, res) => {
  const leaveTypes = await leaveService.getAllLeaveTypes();
  sendResponse(res, httpStatus.OK, true, { leaveTypes }, "Leave types retrieved successfully");
});

const getActiveLeaveTypes = catchAsync(async (req, res) => {
  const leaveTypes = await leaveService.getActiveLeaveTypes();
  sendResponse(res, httpStatus.OK, true, { leaveTypes }, "Active leave types retrieved successfully");
});

const getLeaveType = catchAsync(async (req, res) => {
  const { leaveTypeId } = req.params;
  const leaveType = await leaveService.getLeaveTypeById(leaveTypeId);
  sendResponse(res, httpStatus.OK, true, { leaveType }, "Leave type retrieved successfully");
});

const updateLeaveType = catchAsync(async (req, res) => {
  const { leaveTypeId } = req.params;
  const updateData = pick(req.body, ["name", "code", "description", "maxDays", "isPaid", "isActive"]);

  const leaveType = await leaveService.updateLeaveType(leaveTypeId, updateData);
  sendResponse(res, httpStatus.OK, true, { leaveType }, "Leave type updated successfully");
});

const deleteLeaveType = catchAsync(async (req, res) => {
  const { leaveTypeId } = req.params;
  await leaveService.deleteLeaveType(leaveTypeId);
  sendResponse(res, httpStatus.OK, true, null, "Leave type deleted successfully");
});

// ========== Leave Request Controllers ==========

const createLeaveRequest = catchAsync(async (req, res) => {
  const { employeeId, leaveTypeId, startDate, endDate, reason } = req.body;

  if (!employeeId || !leaveTypeId || !startDate || !endDate) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Employee ID, leave type, start date, and end date are required"
    );
  }

  const leaveRequest = await leaveService.createLeaveRequest({
    employeeId,
    leaveTypeId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    reason,
  });

  sendResponse(res, httpStatus.CREATED, true, { leaveRequest }, "Leave request created successfully");
});

const getLeaveRequests = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = "createdAt",
    sortType = "desc",
    employeeId,
    leaveTypeId,
    status,
    startDate,
    endDate,
  } = req.query;

  const paginationOptions = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    search: search as string,
    sortBy: sortBy as string,
    sortType: sortType as "asc" | "desc",
    employeeId: employeeId as string,
    leaveTypeId: leaveTypeId as string,
    status: status as LeaveRequestStatus | undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  };

  const result = await leaveService.getLeaveRequestsWithPagination(paginationOptions);

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "Leave requests retrieved successfully",
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
    },
  });
});

const getLeaveRequest = catchAsync(async (req, res) => {
  const { leaveRequestId } = req.params;
  const leaveRequest = await leaveService.getLeaveRequestById(leaveRequestId);
  sendResponse(res, httpStatus.OK, true, { leaveRequest }, "Leave request retrieved successfully");
});

const approveLeaveRequest = catchAsync(async (req, res) => {
  const { leaveRequestId } = req.params;
  const approvedBy = req.user?.id || req.employee?.id;

  if (!approvedBy) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const leaveRequest = await leaveService.approveLeaveRequest(leaveRequestId, approvedBy);
  sendResponse(res, httpStatus.OK, true, { leaveRequest }, "Leave request approved successfully");
});

const rejectLeaveRequest = catchAsync(async (req, res) => {
  const { leaveRequestId } = req.params;
  const { rejectionReason } = req.body;
  const rejectedBy = req.user?.id || req.employee?.id;

  if (!rejectedBy) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const leaveRequest = await leaveService.rejectLeaveRequest(leaveRequestId, rejectedBy, rejectionReason);
  sendResponse(res, httpStatus.OK, true, { leaveRequest }, "Leave request rejected successfully");
});

const cancelLeaveRequest = catchAsync(async (req, res) => {
  const { leaveRequestId } = req.params;
  const employeeId = req.user?.id || req.employee?.id;

  if (!employeeId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const leaveRequest = await leaveService.cancelLeaveRequest(leaveRequestId, employeeId);
  sendResponse(res, httpStatus.OK, true, { leaveRequest }, "Leave request cancelled successfully");
});

// ========== Leave Balance Controllers ==========

const getEmployeeLeaveBalance = catchAsync(async (req, res) => {
  const { employeeId } = req.params;
  const { year } = req.query;

  const leaveBalances = await leaveService.getEmployeeLeaveBalance(
    employeeId,
    year ? parseInt(year as string) : undefined
  );
  sendResponse(res, httpStatus.OK, true, { leaveBalances }, "Leave balance retrieved successfully");
});

const initializeLeaveBalance = catchAsync(async (req, res) => {
  const { employeeId, leaveTypeId, year, totalDays } = req.body;

  if (!employeeId || !leaveTypeId || !year || totalDays === undefined) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Employee ID, leave type ID, year, and total days are required"
    );
  }

  const leaveBalance = await leaveService.initializeLeaveBalance(
    employeeId,
    leaveTypeId,
    parseInt(year),
    parseFloat(totalDays)
  );
  sendResponse(res, httpStatus.CREATED, true, { leaveBalance }, "Leave balance initialized successfully");
});

export default {
  // Leave Type
  createLeaveType,
  getLeaveTypes,
  getActiveLeaveTypes,
  getLeaveType,
  updateLeaveType,
  deleteLeaveType,
  // Leave Request
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  // Leave Balance
  getEmployeeLeaveBalance,
  initializeLeaveBalance,
};
