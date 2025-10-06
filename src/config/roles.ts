import { Role, Permission } from "@prisma/client";

// Define permissions for each role
const allRoles = {
  [Role.ADMIN]: [
    // Admin has ALL permissions
    Permission.ASSIGN_PERMISSIONS,

    // Employee Management
    Permission.CREATE_EMPLOYEE,
    Permission.READ_EMPLOYEE,
    Permission.UPDATE_EMPLOYEE,
    Permission.DELETE_EMPLOYEE,
    Permission.MANAGE_EMPLOYEES,

    // Client Management
    Permission.CREATE_CLIENT,
    Permission.READ_CLIENT,
    Permission.UPDATE_CLIENT,
    Permission.DELETE_CLIENT,

    // Task Management
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,

    // Branch Management
    Permission.CREATE_BRANCH,
    Permission.READ_BRANCH,
    Permission.UPDATE_BRANCH,
    Permission.DELETE_BRANCH,

    // Service Management
    Permission.CREATE_SERVICE,
    Permission.READ_SERVICE,
    Permission.UPDATE_SERVICE,
    Permission.DELETE_SERVICE,

    // Payment Methods Management
    Permission.CREATE_PAYMENT_METHOD,
    Permission.READ_PAYMENT_METHOD,
    Permission.UPDATE_PAYMENT_METHOD,
    Permission.DELETE_PAYMENT_METHOD,

    // Invoice Management
    Permission.CREATE_INVOICE,
    Permission.READ_INVOICE,
    Permission.UPDATE_INVOICE,
    Permission.DELETE_INVOICE,

    // Bank Account Management
    Permission.CREATE_BANK_ACCOUNT,
    Permission.READ_BANK_ACCOUNT,
    Permission.UPDATE_BANK_ACCOUNT,
    Permission.DELETE_BANK_ACCOUNT,

    // Report Management
    Permission.GENERATE_REPORTS,
    Permission.VIEW_REPORTS,
  ],
  [Role.HR]: [
    // Employee Management
    Permission.CREATE_EMPLOYEE,
    Permission.READ_EMPLOYEE,
    Permission.UPDATE_EMPLOYEE,
    Permission.DELETE_EMPLOYEE,
    Permission.MANAGE_EMPLOYEES,

    // Service Management
    Permission.CREATE_SERVICE,
    Permission.READ_SERVICE,
    Permission.UPDATE_SERVICE,
    Permission.DELETE_SERVICE,

    // Client Management
    Permission.CREATE_CLIENT,
    Permission.READ_CLIENT,
    Permission.UPDATE_CLIENT,
    Permission.DELETE_CLIENT,

    // Invoice Management
    Permission.CREATE_INVOICE,
    Permission.READ_INVOICE,
    Permission.UPDATE_INVOICE,
    Permission.DELETE_INVOICE,

    // Bank Account Management
    Permission.CREATE_BANK_ACCOUNT,
    Permission.READ_BANK_ACCOUNT,
    Permission.UPDATE_BANK_ACCOUNT,
    Permission.DELETE_BANK_ACCOUNT,

    // Payment Methods Management
    Permission.CREATE_PAYMENT_METHOD,
    Permission.READ_PAYMENT_METHOD,
    Permission.UPDATE_PAYMENT_METHOD,
    Permission.DELETE_PAYMENT_METHOD,

    // Report Management
    Permission.GENERATE_REPORTS,
    Permission.VIEW_REPORTS,

    // NOTE: HR does NOT have access to:
    // - Task Management (CREATE_TASK, READ_TASK, UPDATE_TASK, DELETE_TASK, ASSIGN_TASK)
    // - Branch Management (CREATE_BRANCH, READ_BRANCH, UPDATE_BRANCH, DELETE_BRANCH)
  ],
  [Role.EMPLOYEE]: [
    // Client Management
    Permission.CREATE_CLIENT,
    Permission.READ_CLIENT,
    Permission.UPDATE_CLIENT,
    Permission.DELETE_CLIENT,

    // Task Management
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,

    // Invoice Management
    Permission.CREATE_INVOICE,
    Permission.READ_INVOICE,
    Permission.UPDATE_INVOICE,
    Permission.DELETE_INVOICE,

    // Report Management (read-only for employees)
    Permission.VIEW_REPORTS,

    // NOTE: Employee ONLY has access to:
    // - Client Management
    // - Task Management
    // - Invoice Management
    // - View Reports (read-only)
    //
    // Employee does NOT have access to:
    // - Employee Management
    // - Branch Management
    // - Service Management
    // - Payment Methods Management
    // - Bank Account Management
    // - Generate Reports
  ],
  [Role.MANAGER]: [
    // Employee Management
    Permission.CREATE_EMPLOYEE,
    Permission.READ_EMPLOYEE,
    Permission.UPDATE_EMPLOYEE,
    Permission.DELETE_EMPLOYEE,
    Permission.MANAGE_EMPLOYEES,

    // Client Management
    Permission.CREATE_CLIENT,
    Permission.READ_CLIENT,
    Permission.UPDATE_CLIENT,
    Permission.DELETE_CLIENT,

    // Task Management
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.ASSIGN_TASK,

    // Invoice Management
    Permission.CREATE_INVOICE,
    Permission.READ_INVOICE,
    Permission.UPDATE_INVOICE,
    Permission.DELETE_INVOICE,

    // Bank Account Management
    Permission.CREATE_BANK_ACCOUNT,
    Permission.READ_BANK_ACCOUNT,
    Permission.UPDATE_BANK_ACCOUNT,
    Permission.DELETE_BANK_ACCOUNT,

    // Report Management
    Permission.GENERATE_REPORTS,
    Permission.VIEW_REPORTS,

    // NOTE: Manager does NOT have access to:
    // - Branch Management (CREATE_BRANCH, READ_BRANCH, UPDATE_BRANCH, DELETE_BRANCH)
    // - Payment Methods Management (CREATE_PAYMENT_METHOD, READ_PAYMENT_METHOD, UPDATE_PAYMENT_METHOD, DELETE_PAYMENT_METHOD)
    // - Service Management (CREATE_SERVICE, READ_SERVICE, UPDATE_SERVICE, DELETE_SERVICE)
  ],
};

export const roles = Object.keys(allRoles);
export { allRoles };

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
