import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { employeeService } from "../services";
import { isPasswordMatch, encryptPassword } from "../utils/encryption";

const getMyProfile = catchAsync(async (req, res) => {
  const employeeId = req.employee?.id;
  if (!employeeId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const employee = await employeeService.getEmployeeById(employeeId, [
    "id",
    "employeeId",
    "name",
    "email",
    "role",
    "isActive",
    "branchId",
    "createdAt",
    "updatedAt",
  ]);

  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Profile not found");
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: "Profile retrieved successfully",
    data: employee,
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const employeeId = req.employee?.id;
  if (!employeeId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const { name, email } = req.body;

  // Check if email is being updated and if it already exists
  if (email) {
    const existingEmployee = await employeeService.getEmployeeByEmail(email);
    if (existingEmployee && existingEmployee.id !== employeeId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }
  }

  const updatedEmployee = await employeeService.updateEmployeeById(
    employeeId,
    { name, email },
    [
      "id",
      "employeeId",
      "name",
      "email",
      "role",
      "isActive",
      "branchId",
      "createdAt",
      "updatedAt",
    ]
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedEmployee,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const employeeId = req.employee?.id;
  if (!employeeId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const { currentPassword, newPassword } = req.body;

  // Get employee with password for verification
  const employee = await employeeService.getEmployeeById(employeeId, [
    "id",
    "password",
  ]);

  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }

  // Verify current password
  const isPasswordValid = await isPasswordMatch(
    currentPassword,
    employee.password
  );

  if (!isPasswordValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Current password is incorrect");
  }

  // Update password
  await employeeService.updateEmployeeById(employeeId, {
    password: await encryptPassword(newPassword),
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: "Password changed successfully",
  });
});

export default {
  getMyProfile,
  updateMyProfile,
  changePassword,
};
