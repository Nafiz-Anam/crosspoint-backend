import { Role, Permission } from "@prisma/client";

// Shared permissions for ADMIN, MANAGER, and HR - they have the same power, only labels differ
const adminManagerHrPermissions = [
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
];

// Define permissions for each role
const allRoles = {
  [Role.ADMIN]: [
    // Admin has ALL permissions (same as MANAGER and HR, plus ASSIGN_PERMISSIONS)
    Permission.ASSIGN_PERMISSIONS,
    ...adminManagerHrPermissions,
  ],
  [Role.HR]: [
    // HR has same permissions as ADMIN and MANAGER (only label differs)
    ...adminManagerHrPermissions,
  ],
  [Role.EMPLOYEE]: [
    // Client Management (NO DELETE - employees cannot delete anything)
    Permission.CREATE_CLIENT,
    Permission.READ_CLIENT,
    Permission.UPDATE_CLIENT,
    // Permission.DELETE_CLIENT, // REMOVED - employees cannot delete

    // Task Management (NO DELETE - employees cannot delete anything)
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    // Permission.DELETE_TASK, // REMOVED - employees cannot delete
    Permission.ASSIGN_TASK,

    // Invoice Management (NO DELETE - employees cannot delete anything)
    Permission.CREATE_INVOICE,
    Permission.READ_INVOICE,
    Permission.UPDATE_INVOICE,
    // Permission.DELETE_INVOICE, // REMOVED - employees cannot delete

    // Service Management (read-only for invoice functionality)
    Permission.READ_SERVICE,

    // Bank Account Management (read-only for invoice functionality)
    Permission.READ_BANK_ACCOUNT,

    // Employee Management (read-only for invoice functionality)
    Permission.READ_EMPLOYEE,

    // Branch Management (read-only for invoice functionality)
    Permission.READ_BRANCH,

    // Report Management (read-only for employees)
    Permission.VIEW_REPORTS,

    // NOTE: Employee has access to:
    // - Client Management (CREATE, READ, UPDATE - NO DELETE)
    // - Task Management (CREATE, READ, UPDATE, ASSIGN - NO DELETE)
    // - Invoice Management (CREATE, READ, UPDATE - NO DELETE)
    // - Service Management (read-only for invoice items)
    // - Bank Account Management (read-only for payment selection)
    // - Employee Management (read-only for assignment)
    // - Branch Management (read-only for branch information)
    // - View Reports (read-only)
    //
    // Employee does NOT have access to:
    // - DELETE operations for ANY module (Tasks, Invoices, Clients, etc.)
    // - CREATE/UPDATE/DELETE for Service, Bank Account, Employee, Branch
    // - Payment Methods Management
    // - Generate Reports
    // - Assign Permissions
  ],
  [Role.MANAGER]: [
    // MANAGER has same permissions as ADMIN and HR (only label differs)
    ...adminManagerHrPermissions,
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
