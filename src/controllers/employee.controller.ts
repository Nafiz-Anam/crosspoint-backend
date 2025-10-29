import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { employeeService } from "../services";
import sendResponse from "../utils/responseHandler";
import cronService from "../services/cron.service";
import emailService from "../services/email.service";
import { Role } from "@prisma/client";

const createEmployee = catchAsync(async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    nationalIdentificationNumber,
    role,
    branchId,
    dateOfBirth,
    isActive,
  } = req.body;

  // Enforce role-based creation rules
  const requesterRole = req.employee?.role as Role | undefined;
  const targetRole: Role = (role as Role) || Role.EMPLOYEE;

  // If requester role is unknown, block
  if (!requesterRole) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  // Admin can create any role
  if (requesterRole === Role.ADMIN) {
    // allowed
  } else if (requesterRole === Role.HR) {
    // HR cannot create ADMIN
    if (targetRole === Role.ADMIN) {
      throw new ApiError(httpStatus.FORBIDDEN, "HR cannot create ADMIN users");
    }
  } else if (requesterRole === Role.MANAGER) {
    // Manager can create EMPLOYEE only
    if (targetRole !== Role.EMPLOYEE) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Managers can create EMPLOYEE users only"
      );
    }
  } else {
    // Employees or other roles cannot create users
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Insufficient permissions to create users"
    );
  }

  const employee = await employeeService.createEmployee({
    email,
    password,
    name,
    phone,
    nationalIdentificationNumber,
    role: targetRole,
    branchId,
    dateOfBirth: new Date(dateOfBirth),
    isActive,
  });

  // Send welcome email to the new employee
  try {
    await emailService.sendWelcomeEmail(
      employee.email,
      employee.name || "",
      employee.email,
      password, // Send the plain text password for initial login
      employee.role,
      employee.employeeId || undefined
    );
  } catch (emailError) {
    // Log the error but don't fail the employee creation
    console.error("Failed to send welcome email:", emailError);
    // You might want to add this to a proper logger in production
  }

  res.status(httpStatus.CREATED).send(employee);
});

const getEmployees = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = "createdAt",
    sortType = "desc",
    role,
    isActive,
    branchId,
  } = req.query;

  const paginationOptions = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    search: search as string,
    sortBy: sortBy as string,
    sortType: sortType as "asc" | "desc",
    role: role as string,
    isActive: isActive as string,
    branchId: branchId as string,
  };

  // Exclude the currently logged-in employee and all admin users from the results
  const currentUserId = req.user?.id;
  const excludeConditions = [];

  if (currentUserId) {
    excludeConditions.push({ id: { not: currentUserId } });
  }

  // Always exclude admin users from employee list
  excludeConditions.push({ role: { not: Role.ADMIN } });

  const currentUserRole = req.user?.role;
  const currentUserBranchId = req.user?.branchId || undefined;

  const result = await employeeService.getEmployeesWithPagination(
    paginationOptions,
    excludeConditions,
    currentUserRole,
    currentUserBranchId
  );

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "Employees retrieved successfully",
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
  const {
    sortBy = "createdAt",
    sortType = "desc",
    name,
    role = "EMPLOYEE",
  } = req.query;

  const options = {
    sortBy: sortBy as string,
    sortType: sortType as "asc" | "desc",
    role: role as string,
    name: name as string,
  };

  // Get current user info for branch filtering
  const currentUser = req.employee || req.user;
  const currentUserRole = currentUser?.role ?? undefined;
  const currentUserBranchId = currentUser?.branchId ?? undefined;

  const employees = await employeeService.getAllEmployeesForDropdown(
    options,
    currentUserRole,
    currentUserBranchId
  );

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "All employees retrieved successfully",
    data: employees,
    total: employees.length,
  });
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
