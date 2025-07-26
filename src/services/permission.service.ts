import { Permission, User, UserPermission } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";

/**
 * Assign permissions to a user
 * @param {string} userId
 * @param {Permission[]} permissions
 * @returns {Promise<UserPermission[]>}
 */
const assignPermissions = async (
  userId: string,
  permissions: Permission[]
): Promise<UserPermission[]> => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Create user permissions
  const userPermissions = await Promise.all(
    permissions.map(permission =>
      prisma.userPermission.upsert({
        where: {
          userId_permission: {
            userId,
            permission
          }
        },
        update: {},
        create: {
          userId,
          permission
        }
      })
    )
  );

  return userPermissions;
};

/**
 * Revoke permissions from a user
 * @param {string} userId
 * @param {Permission[]} permissions
 * @returns {Promise<void>}
 */
const revokePermissions = async (
  userId: string,
  permissions: Permission[]
): Promise<void> => {
  await prisma.userPermission.deleteMany({
    where: {
      userId,
      permission: {
        in: permissions
      }
    }
  });
};

/**
 * Get user permissions
 * @param {string} userId
 * @returns {Promise<Permission[]>}
 */
const getUserPermissions = async (userId: string): Promise<Permission[]> => {
  const userPermissions = await prisma.userPermission.findMany({
    where: { userId },
    select: { permission: true }
  });

  return userPermissions.map(up => up.permission);
};

/**
 * Check if user has specific permission
 * @param {string} userId
 * @param {Permission} permission
 * @returns {Promise<boolean>}
 */
const hasPermission = async (
  userId: string,
  permission: Permission
): Promise<boolean> => {
  const userPermission = await prisma.userPermission.findUnique({
    where: {
      userId_permission: {
        userId,
        permission
      }
    }
  });

  return !!userPermission;
};

/**
 * Check if user has any of the required permissions
 * @param {string} userId
 * @param {Permission[]} permissions
 * @returns {Promise<boolean>}
 */
const hasAnyPermission = async (
  userId: string,
  permissions: Permission[]
): Promise<boolean> => {
  const userPermissions = await prisma.userPermission.findMany({
    where: {
      userId,
      permission: {
        in: permissions
      }
    }
  });

  return userPermissions.length > 0;
};

/**
 * Check if user has all required permissions
 * @param {string} userId
 * @param {Permission[]} permissions
 * @returns {Promise<boolean>}
 */
const hasAllPermissions = async (
  userId: string,
  permissions: Permission[]
): Promise<boolean> => {
  const userPermissions = await prisma.userPermission.findMany({
    where: {
      userId,
      permission: {
        in: permissions
      }
    }
  });

  return userPermissions.length === permissions.length;
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
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getAllPermissions,
}; 