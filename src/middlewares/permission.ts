import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import { Permission } from "@prisma/client";
import prisma from "../client";

// Middleware to load user permissions
export const loadUserPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.employee?.id) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"));
    }

    // Get user permissions directly from the employee model
    const employee = await prisma.employee.findUnique({
      where: { id: req.employee.id },
      select: { permissions: true }, // Fetch the permissions array directly
    });

    if (!employee) {
      return next(new ApiError(httpStatus.NOT_FOUND, "Employee not found"));
    }

    // Attach the permissions array to the request object
    req.employeePermissions = employee.permissions || []; // Default to empty array if undefined
    next();
  } catch (error) {
    next(
      new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Error loading permissions"
      )
    );
  }
};

/// Middleware to check if user has a specific permission
export const requirePermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if employee permissions exist
    if (!req.employeePermissions) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "Permissions not loaded")
      );
    }

    // Optional chaining to safely access permissions
    if (!req.employeePermissions?.includes(requiredPermission)) {
      return next(
        new ApiError(httpStatus.FORBIDDEN, "Insufficient permissions")
      );
    }

    next();
  };
};

// Middleware to check if user has any of the required permissions
export const requireAnyPermission = (requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if employee permissions exist
    if (!req.employeePermissions) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "Permissions not loaded")
      );
    }

    // Optional chaining to safely access permissions
    const hasPermission = requiredPermissions.some((permission) =>
      req.employeePermissions?.includes(permission)
    );

    if (!hasPermission) {
      return next(
        new ApiError(httpStatus.FORBIDDEN, "Insufficient permissions")
      );
    }

    next();
  };
};

// Middleware to check if user has all required permissions
export const requireAllPermissions = (requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if employee permissions exist
    if (!req.employeePermissions) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "Permissions not loaded")
      );
    }

    // Optional chaining to safely access permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      req.employeePermissions?.includes(permission)
    );

    if (!hasAllPermissions) {
      return next(
        new ApiError(httpStatus.FORBIDDEN, "Insufficient permissions")
      );
    }

    next();
  };
};
