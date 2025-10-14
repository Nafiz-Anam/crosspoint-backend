import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { taskService } from "../services";
import sendResponse from "../utils/responseHandler";
import { TaskStatus, Role } from "@prisma/client";
import cronService from "../services/cron.service";

const getTaskStatistics = catchAsync(async (req, res) => {
  const userId = req.employee?.id;
  const userRole = req.employee?.role;
  const userBranchId = req.employee?.branchId;

  if (!userId || !userRole) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const stats = await taskService.getTaskStatistics(
    userId,
    userRole,
    userBranchId || undefined
  );

  sendResponse(
    res,
    httpStatus.OK,
    true,
    stats,
    "Task statistics retrieved successfully"
  );
});

const createTask = catchAsync(async (req, res) => {
  const {
    description,
    clientId,
    serviceId,
    assignedEmployeeId,
    status,
    dueDate,
    startDate,
  } = req.body;

  // Validate required fields
  if (!description) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Description is required");
  }
  if (!clientId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Client ID is required");
  }
  if (!serviceId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Service ID is required");
  }
  if (!assignedEmployeeId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Assigned employee ID is required"
    );
  }
  if (!status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Status is required");
  }
  if (!dueDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Due date is required");
  }
  if (!startDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Start date is required");
  }

  // Validate status is a valid TaskStatus enum value
  if (!Object.values(TaskStatus).includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid status: "${status}". Must be one of: ${Object.values(
        TaskStatus
      ).join(", ")}`
    );
  }

  // Validate date order
  const startDateObj = new Date(startDate);
  const dueDateObj = new Date(dueDate);
  if (startDateObj >= dueDateObj) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Start date must be before due date"
    );
  }

  const task = await taskService.createTask(
    clientId,
    serviceId,
    assignedEmployeeId,
    description,
    status,
    new Date(dueDate),
    new Date(startDate)
  );

  sendResponse(
    res,
    httpStatus.CREATED,
    true,
    { task },
    "Task created successfully"
  );
});

const getTasks = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = "createdAt",
    sortType = "desc",
    status,
    assignedEmployeeId,
    branchId,
  } = req.query;

  const paginationOptions = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    search: search as string,
    sortBy: sortBy as string,
    sortType: sortType as "asc" | "desc",
    status: status as string,
    assignedEmployeeId: assignedEmployeeId as string,
    branchId: branchId as string,
  };

  const currentUserId = req.user!.id;
  const currentUserRole = req.user!.role;
  const currentUserBranchId = req.user!.branchId || undefined;

  const result = await taskService.getTasksWithPagination(
    paginationOptions,
    currentUserId,
    currentUserRole,
    currentUserBranchId
  );

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "Tasks retrieved successfully",
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

const getTask = catchAsync(async (req, res) => {
  const currentUserId = req.user!.id;
  const currentUserRole = req.user!.role;

  const task = await taskService.getTaskById(
    req.params.taskId,
    currentUserId,
    currentUserRole
  );

  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, "Task not found");
  }

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { task },
    "Task retrieved successfully"
  );
});

const updateTask = catchAsync(async (req, res) => {
  const currentUserId = req.user!.id;
  const currentUserRole = req.user!.role;

  // Convert date strings to Date objects if provided
  const updateBody = { ...req.body };
  if (updateBody.dueDate) {
    updateBody.dueDate = new Date(updateBody.dueDate);
  }
  if (updateBody.startDate) {
    updateBody.startDate = new Date(updateBody.startDate);
  }
  if (updateBody.completedDate) {
    updateBody.completedDate = new Date(updateBody.completedDate);
  }

  // Validate status is a valid TaskStatus enum value
  if (
    updateBody.status &&
    !Object.values(TaskStatus).includes(updateBody.status)
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid status: "${updateBody.status}". Must be one of: ${Object.values(
        TaskStatus
      ).join(", ")}`
    );
  }

  const task = await taskService.updateTaskById(
    req.params.taskId,
    updateBody,
    currentUserId,
    currentUserRole
  );

  sendResponse(res, httpStatus.OK, true, { task }, "Task updated successfully");
});

const deleteTask = catchAsync(async (req, res) => {
  const currentUserId = req.user!.id;
  const currentUserRole = req.user!.role;

  await taskService.deleteTaskById(
    req.params.taskId,
    currentUserId,
    currentUserRole
  );

  sendResponse(res, httpStatus.OK, true, {}, "Task deleted successfully");
});

const getTasksByClient = catchAsync(async (req, res) => {
  const currentUserId = req.user!.id;
  const currentUserRole = req.user!.role;

  const tasks = await taskService.getTasksByClientId(
    req.params.clientId,
    currentUserId,
    currentUserRole
  );

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { tasks },
    "Client tasks retrieved successfully"
  );
});

const checkTaskDeadlines = catchAsync(async (req, res) => {
  await cronService.checkTaskDeadlines();
  sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "Task deadline check completed successfully"
  );
});

export {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getTasksByClient,
  getTaskStatistics,
  checkTaskDeadlines,
};
