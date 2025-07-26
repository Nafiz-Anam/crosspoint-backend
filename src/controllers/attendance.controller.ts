import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { attendanceService } from "../services";
import { AttendanceStatus } from "@prisma/client";

const checkIn = catchAsync(async (req, res) => {
  const { notes } = req.body;
  const employeeId = req.employee?.id;
  if (!employeeId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }
  const attendance = await attendanceService.checkIn(employeeId, notes);
  res.status(httpStatus.OK).json({
    success: true,
    message: "Check-in successful",
    data: attendance,
  });
});

const checkOut = catchAsync(async (req, res) => {
  const { notes } = req.body;
  const employeeId = req.employee?.id;
  if (!employeeId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }
  const attendance = await attendanceService.checkOut(employeeId, notes);
  res.status(httpStatus.OK).json({
    success: true,
    message: "Check-out successful",
    data: attendance,
  });
});

const getMyAttendance = catchAsync(async (req, res) => {
  const employeeId = req.employee?.id;
  const { date } = req.query;
  if (!employeeId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }
  const targetDate = date ? new Date(date as string) : new Date();
  const attendance = await attendanceService.getAttendanceByDate(
    employeeId,
    targetDate
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "Attendance retrieved successfully",
    data: attendance,
  });
});

const getMyAttendanceRange = catchAsync(async (req, res) => {
  const employeeId = req.employee?.id;
  const { startDate, endDate } = req.query;
  if (!employeeId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }
  if (!startDate || !endDate) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Start date and end date are required"
    );
  }
  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  const attendances = await attendanceService.getAttendanceByDateRange(
    employeeId,
    start,
    end
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "Attendance records retrieved successfully",
    data: attendances,
  });
});

const getMyAttendanceStats = catchAsync(async (req, res) => {
  const employeeId = req.employee?.id;
  const { startDate, endDate } = req.query;
  if (!employeeId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }
  if (!startDate || !endDate) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Start date and end date are required"
    );
  }
  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  const stats = await attendanceService.getUserAttendanceStats(
    employeeId,
    start,
    end
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "Attendance statistics retrieved successfully",
    data: stats,
  });
});

const getBranchAttendance = catchAsync(async (req, res) => {
  const { branchId } = req.params;
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Start date and end date are required"
    );
  }
  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  const attendances = await attendanceService.getBranchAttendanceByDateRange(
    branchId,
    start,
    end
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "Branch attendance retrieved successfully",
    data: attendances,
  });
});

const getTodayBranchAttendance = catchAsync(async (req, res) => {
  const { branchId } = req.params;
  const attendances = await attendanceService.getTodayAttendanceByBranch(
    branchId
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "Today's branch attendance retrieved successfully",
    data: attendances,
  });
});

const getBranchAttendanceStats = catchAsync(async (req, res) => {
  const { branchId } = req.params;
  const { date } = req.query;
  const targetDate = date ? new Date(date as string) : new Date();
  const stats = await attendanceService.getBranchAttendanceStats(
    branchId,
    targetDate
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "Branch attendance statistics retrieved successfully",
    data: stats,
  });
});

const markAttendance = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { date, status, checkIn, checkOut, notes } = req.body;
  if (!date || !status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Date and status are required");
  }
  if (!Object.values(AttendanceStatus).includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid attendance status");
  }
  const targetDate = new Date(date);
  const checkInTime = checkIn ? new Date(checkIn) : undefined;
  const checkOutTime = checkOut ? new Date(checkOut) : undefined;
  const attendance = await attendanceService.markAttendance(
    userId,
    targetDate,
    status as AttendanceStatus,
    checkInTime,
    checkOutTime,
    notes
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "Attendance marked successfully",
    data: attendance,
  });
});

const getUserAttendance = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { date } = req.query;
  const targetDate = date ? new Date(date as string) : new Date();
  const attendance = await attendanceService.getAttendanceByDate(
    userId,
    targetDate
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "User attendance retrieved successfully",
    data: attendance,
  });
});

const getUserAttendanceRange = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Start date and end date are required"
    );
  }
  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  const attendances = await attendanceService.getAttendanceByDateRange(
    userId,
    start,
    end
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "User attendance records retrieved successfully",
    data: attendances,
  });
});

const getUserAttendanceStats = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Start date and end date are required"
    );
  }
  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  const stats = await attendanceService.getUserAttendanceStats(
    userId,
    start,
    end
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: "User attendance statistics retrieved successfully",
    data: stats,
  });
});

export default {
  checkIn,
  checkOut,
  getMyAttendance,
  getMyAttendanceRange,
  getMyAttendanceStats,
  getBranchAttendance,
  getTodayBranchAttendance,
  getBranchAttendanceStats,
  markAttendance,
  getUserAttendance,
  getUserAttendanceRange,
  getUserAttendanceStats,
};
