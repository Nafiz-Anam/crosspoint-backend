import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import { permissionService } from "../services";
import { Permission } from "@prisma/client";
import sendResponse from "../utils/responseHandler";

/**
 * Assign permissions to a user
 * Only ADMIN and HR can assign permissions
 */
const assignPermissions = catchAsync(async (req, res) => {
  const { userId, permissions } = req.body;

  // Validate permissions
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      "Permissions array is required and cannot be empty"
    );
  }

  // Validate that all permissions are valid
  const validPermissions = Object.values(Permission);
  const invalidPermissions = permissions.filter(
    (permission) => !validPermissions.includes(permission)
  );

  if (invalidPermissions.length > 0) {
    return sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      `Invalid permissions: ${invalidPermissions.join(", ")}`
    );
  }

  const userPermissions = await permissionService.assignPermissions(
    userId,
    permissions
  );

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { userPermissions },
    "Permissions assigned successfully"
  );
});

/**
 * Revoke permissions from a user
 * Only ADMIN and HR can revoke permissions
 */
const revokePermissions = catchAsync(async (req, res) => {
  const { userId, permissions } = req.body;

  // Validate permissions
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      "Permissions array is required and cannot be empty"
    );
  }

  await permissionService.revokePermissions(userId, permissions);

  sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "Permissions revoked successfully"
  );
});

/**
 * Get user permissions
 */
const getUserPermissions = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const permissions = await permissionService.getEmployeePermissions(userId);

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { permissions },
    "User permissions retrieved successfully"
  );
});

/**
 * Get all available permissions
 */
const getAllPermissions = catchAsync(async (req, res) => {
  const permissions = permissionService.getAllPermissions();

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { permissions },
    "All permissions retrieved successfully"
  );
});

/**
 * Check if user has specific permission
 */
const checkPermission = catchAsync(async (req, res) => {
  const { userId, permission } = req.params;

  const hasPermission = await permissionService.hasPermission(
    userId,
    permission as Permission
  );

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { hasPermission },
    "Permission check completed"
  );
});

export default {
  assignPermissions,
  revokePermissions,
  getUserPermissions,
  getAllPermissions,
  checkPermission,
};
