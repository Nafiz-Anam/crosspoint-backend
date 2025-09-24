import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { taskService } from "../services";
import sendResponse from "../utils/responseHandler";
import { TaskStatus } from "@prisma/client";

const createTask = catchAsync(async (req, res) => {
  const {
    description,
    clientId,
    serviceId,
    assignedEmployeeId,
    status,
    dueDate,
    startDate,
    notes,
  } = req.body;

  // Validate status is a valid TaskStatus enum value
  if (status && !Object.values(TaskStatus).includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid status: "${status}". Must be one of: ${Object.values(
        TaskStatus
      ).join(", ")}`
    );
  }

  const task = await taskService.createTask(
    clientId,
    serviceId,
    assignedEmployeeId,
    description,
    status || TaskStatus.PENDING,
    dueDate ? new Date(dueDate) : undefined,
    startDate ? new Date(startDate) : undefined,
    notes
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
  const filter = pick(req.query, [
    "title",
    "status",
    "clientId",
    "serviceId",
    "assignedEmployeeId",
  ]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);

  // Add text search for title if provided
  if (filter.title) {
    filter.title = {
      contains: filter.title,
      mode: "insensitive",
    };
  }

  const currentUserId = req.user!.id;
  const currentUserRole = req.user!.role;

  const result = await taskService.queryTasks(
    filter,
    options,
    currentUserId,
    currentUserRole
  );

  sendResponse(
    res,
    httpStatus.OK,
    true,
    result,
    "Tasks retrieved successfully"
  );
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

export {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getTasksByClient,
};
