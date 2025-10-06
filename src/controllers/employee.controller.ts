import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { employeeService } from "../services";
import sendResponse from "../utils/responseHandler";
import cronService from "../services/cron.service";
import { Role } from "@prisma/client";

const createEmployee = catchAsync(async (req, res) => {
  const {
    email,
    password,
    name,
    nationalIdentificationNumber,
    role,
    branchId,
    dateOfBirth,
    isActive,
  } = req.body;

  const employee = await employeeService.createEmployee({
    email,
    password,
    name,
    nationalIdentificationNumber,
    role,
    branchId,
    dateOfBirth: new Date(dateOfBirth),
    isActive,
  });

  res.status(httpStatus.CREATED).send(employee);
});

const getEmployees = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    "name",
    "nationalIdentificationNumber",
    "role",
  ]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);

  // Convert string values to appropriate types for options
  const processedOptions = {
    ...options,
    limit: options.limit ? parseInt(options.limit as string, 10) : undefined,
    page: options.page ? parseInt(options.page as string, 10) : undefined,
  };

  // Exclude the currently logged-in employee and all admin users from the results
  const currentUserId = req.user?.id;
  const excludeConditions = [];

  if (currentUserId) {
    excludeConditions.push({ id: { not: currentUserId } });
  }

  // Always exclude admin users from employee list
  excludeConditions.push({ role: { not: Role.ADMIN } });

  if (excludeConditions.length > 0) {
    filter.AND = excludeConditions;
  }

  const result = await employeeService.queryEmployees(filter, processedOptions);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Employee retrieved successfully",
    data: result,
  });
});

const getEmployee = catchAsync(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }
  res.send(employee);
});

const updateEmployee = catchAsync(async (req, res) => {
  const employee = await employeeService.updateEmployeeById(
    req.params.employeeId,
    req.body
  );
  res.send(employee);
});

const updateProfileImage = catchAsync(async (req, res) => {
  const { profileImage } = req.body;
  const employeeId = req.params.employeeId;

  const employee = await employeeService.updateEmployeeById(employeeId, {
    profileImage,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: "Profile image updated successfully",
    data: employee,
  });
});

const uploadProfileImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No profile image file provided"
    );
  }

  const profileImageUrl = await employeeService.uploadProfileImage(req.file);
  res.status(httpStatus.OK).json({
    success: true,
    message: "Profile image uploaded successfully",
    data: { profileImageUrl },
  });
});

const deleteEmployee = catchAsync(async (req, res) => {
  await employeeService.deleteEmployeeById(req.params.employeeId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getHREmployees = catchAsync(async (req, res) => {
  const filter = { ...pick(req.query, ["name"]), role: "HR" };
  const options = pick(req.query, ["sortBy", "limit", "page"]);

  // Convert string values to appropriate types for options
  const processedOptions = {
    ...options,
    limit: options.limit ? parseInt(options.limit as string, 10) : undefined,
    page: options.page ? parseInt(options.page as string, 10) : undefined,
  };

  const result = await employeeService.queryEmployees(filter, processedOptions);
  res.send(result);
});

const getEmployeesList = catchAsync(async (req, res) => {
  const filter = { ...pick(req.query, ["name"]), role: "EMPLOYEE" };
  const options = pick(req.query, ["sortBy", "limit", "page"]);

  // Convert string values to appropriate types for options
  const processedOptions = {
    ...options,
    limit: options.limit ? parseInt(options.limit as string, 10) : undefined,
    page: options.page ? parseInt(options.page as string, 10) : undefined,
  };

  const result = await employeeService.queryEmployees(filter, processedOptions);
  res.send(result);
});

const checkEmployeeBirthdays = catchAsync(async (req, res) => {
  await cronService.checkEmployeeBirthdays();
  sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "Employee birthday check completed successfully"
  );
});

export default {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  updateProfileImage,
  uploadProfileImage,
  deleteEmployee,
  getHREmployees,
  getEmployeesList,
  checkEmployeeBirthdays,
};
