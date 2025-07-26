import { Role, Permission } from "@prisma/client";

// Define permissions for each role
const allRoles = {
  [Role.ADMIN]: [
    // User Management
    Permission.MANAGE_USERS,
    Permission.ASSIGN_PERMISSIONS,

    // All CRUD operations
    Permission.CREATE_CLIENT,
    Permission.READ_CLIENT,
    Permission.UPDATE_CLIENT,
    Permission.DELETE_CLIENT,
    Permission.CREATE_SERVICE,
    Permission.READ_SERVICE,
    Permission.UPDATE_SERVICE,
    Permission.DELETE_SERVICE,
    Permission.CREATE_INVOICE,
    Permission.READ_INVOICE,
    Permission.UPDATE_INVOICE,
    Permission.DELETE_INVOICE,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_REPORTS,
  ],
  [Role.HR]: [
    // User Management
    Permission.MANAGE_USERS,
    Permission.ASSIGN_PERMISSIONS,

    // All CRUD operations
    Permission.CREATE_CLIENT,
    Permission.READ_CLIENT,
    Permission.UPDATE_CLIENT,
    Permission.DELETE_CLIENT,
    Permission.CREATE_SERVICE,
    Permission.READ_SERVICE,
    Permission.UPDATE_SERVICE,
    Permission.DELETE_SERVICE,
    Permission.CREATE_INVOICE,
    Permission.READ_INVOICE,
    Permission.UPDATE_INVOICE,
    Permission.DELETE_INVOICE,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_REPORTS,
  ],
  [Role.EMPLOYEE]: [
    // Employees start with no permissions by default
    // Permissions will be assigned individually
  ],
};

export const roles = Object.keys(allRoles);

export const roleRights = new Map(Object.entries(allRoles));

// Helper function to check if a user has a specific permission
export const hasPermission = (
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean => {
  return userPermissions.includes(requiredPermission);
};

// Helper function to check if a user has any of the required permissions
export const hasAnyPermission = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
};

// Helper function to check if a user has all required permissions
export const hasAllPermissions = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
};
