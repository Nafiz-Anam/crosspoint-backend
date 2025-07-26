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

    // Get user permissions from database
    const userPermissions = await prisma.userPermission.findMany({
      where: { employeeId: req.employee.id },
      select: { permission: true },
    });

    req.employeePermissions = userPermissions.map((up) => up.permission);
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

// Middleware to check if user has specific permission
export const requirePermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.employeePermissions) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "Permissions not loaded")
      );
    }

    if (!req.employeePermissions.includes(requiredPermission)) {
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
    if (!req.employeePermissions) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "Permissions not loaded")
      );
    }

    const hasPermission = requiredPermissions.some((permission) =>
      req.employeePermissions!.includes(permission)
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
    if (!req.employeePermissions) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "Permissions not loaded")
      );
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      req.employeePermissions!.includes(permission)
    );

    if (!hasAllPermissions) {
      return next(
        new ApiError(httpStatus.FORBIDDEN, "Insufficient permissions")
      );
    }

    next();
  };
};
