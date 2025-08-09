import { Permission, Employee } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";

/**
 * Assign permissions to an employee
 * @param {string} employeeId
 * @param {Permission[]} permissions
 * @returns {Promise<Employee>} The updated employee with assigned permissions
 */
const assignPermissions = async (
  employeeId: string,
  permissions: Permission[]
): Promise<Employee> => {
  // Check if employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }

  // Assign new permissions by updating the permissions array
  const updatedEmployee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      permissions: {
        set: [...permissions], // Replace current permissions with the new ones
      },
    },
  });

  return updatedEmployee;
};

/**
 * Revoke permissions from an employee
 * @param {string} employeeId
 * @param {Permission[]} permissions
 * @returns {Promise<Employee>} The updated employee with revoked permissions
 */
const revokePermissions = async (
  employeeId: string,
  permissions: Permission[]
): Promise<Employee> => {
  // Check if employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }

  // Revoke permissions by filtering them out from the employee's permissions array
  const updatedEmployee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      permissions: {
        set: employee.permissions.filter(
          (permission) => !permissions.includes(permission)
        ),
      },
    },
  });

  return updatedEmployee;
};

/**
 * Get employee permissions
 * @param {string} employeeId
 * @returns {Promise<Permission[]>} Array of permissions
 */
const getEmployeePermissions = async (
  employeeId: string
): Promise<Permission[]> => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      permissions: true, // Directly select the permissions array
    },
  });

  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }

  return employee.permissions;
};

/**
 * Check if employee has specific permission
 * @param {string} employeeId
 * @param {Permission} permission
 * @returns {Promise<boolean>} True if the employee has the permission
 */
const hasPermission = async (
  employeeId: string,
  permission: Permission
): Promise<boolean> => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      permissions: true,
    },
  });

  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }

  return employee.permissions.includes(permission);
};

/**
 * Check if employee has any of the required permissions
 * @param {string} employeeId
 * @param {Permission[]} permissions
 * @returns {Promise<boolean>} True if the employee has any of the required permissions
 */
const hasAnyPermission = async (
  employeeId: string,
  permissions: Permission[]
): Promise<boolean> => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      permissions: true,
    },
  });

  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }

  // Check if any of the required permissions are in the employee's permissions
  return permissions.some((permission) =>
    employee.permissions.includes(permission)
  );
};

/**
 * Check if employee has all required permissions
 * @param {string} employeeId
 * @param {Permission[]} permissions
 * @returns {Promise<boolean>} True if the employee has all required permissions
 */
const hasAllPermissions = async (
  employeeId: string,
  permissions: Permission[]
): Promise<boolean> => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      permissions: true,
    },
  });

  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }

  // Check if the employee has all the required permissions
  return permissions.every((permission) =>
    employee.permissions.includes(permission)
  );
};

/**
 * Get all available permissions
 * @returns {Permission[]} Array of all available permissions
 */
const getAllPermissions = (): Permission[] => {
  return Object.values(Permission); // Convert the Permission enum to an array of permissions
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
