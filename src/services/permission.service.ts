import { Permission, Employee, UserPermission } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";

/**
 * Assign permissions to an employee
 * @param {string} employeeId
 * @returns {Promise<UserPermission[]>}
 */
const assignPermissions = async (
  employeeId: string,
  permissions: Permission[]
): Promise<UserPermission[]> => {
  // Check if employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  });
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }
  // Create employee permissions
  const employeePermissions = await Promise.all(
    permissions.map((permission) =>
      prisma.userPermission.upsert({
        where: { employeeId_permission: { employeeId, permission } },
        update: {},
        create: { employeeId, permission },
      })
    )
  );
  return employeePermissions;
};

/**
 * Revoke permissions from an employee
 * @param {string} employeeId
 * @param {Permission[]} permissions
 * @returns {Promise<void>}
 */
const revokePermissions = async (
  employeeId: string,
  permissions: Permission[]
): Promise<void> => {
  await prisma.userPermission.deleteMany({
    where: {
      employeeId,
      permission: {
        in: permissions
      }
    }
  });
};

/**
 * Get employee permissions
 * @param {string} employeeId
 * @returns {Promise<Permission[]>}
 */
const getEmployeePermissions = async (employeeId: string): Promise<Permission[]> => {
  const employeePermissions = await prisma.userPermission.findMany({
    where: { employeeId },
    select: { permission: true }
  });

  return employeePermissions.map(up => up.permission);
};

/**
 * Check if employee has specific permission
 * @param {string} employeeId
 * @param {Permission} permission
 * @returns {Promise<boolean>}
 */
const hasPermission = async (
  employeeId: string,
  permission: Permission
): Promise<boolean> => {
  const employeePermission = await prisma.userPermission.findUnique({
    where: {
      employeeId_permission: {
        employeeId,
        permission
      }
    }
  });

  return !!employeePermission;
};

/**
 * Check if employee has any of the required permissions
 * @param {string} employeeId
 * @param {Permission[]} permissions
 * @returns {Promise<boolean>}
 */
const hasAnyPermission = async (
  employeeId: string,
  permissions: Permission[]
): Promise<boolean> => {
  const employeePermissions = await prisma.userPermission.findMany({
    where: {
      employeeId,
      permission: {
        in: permissions
      }
    }
  });

  return employeePermissions.length > 0;
};

/**
 * Check if employee has all required permissions
 * @param {string} employeeId
 * @param {Permission[]} permissions
 * @returns {Promise<boolean>}
 */
const hasAllPermissions = async (
  employeeId: string,
  permissions: Permission[]
): Promise<boolean> => {
  const employeePermissions = await prisma.userPermission.findMany({
    where: {
      employeeId,
      permission: {
        in: permissions
      }
    }
  });

  return employeePermissions.length === permissions.length;
};

/**
 * Get all available permissions
 * @returns {Permission[]}
 */
const getAllPermissions = (): Permission[] => {
  return Object.values(Permission);
};

export default {
  assignPermissions,
  revokePermissions,
  getEmployeePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getAllPermissions,
}; 