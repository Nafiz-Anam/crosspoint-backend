import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import { Role } from "@prisma/client";

/**
 * Middleware to add branch filtering for MANAGER role
 * This ensures managers can only access data from their own branch
 */
export const addBranchFilter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.employee || req.user;

    if (!user) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated")
      );
    }

    // Only apply branch filtering for MANAGER role
    if (user.role === Role.MANAGER) {
      if (!user.branchId) {
        return next(
          new ApiError(
            httpStatus.BAD_REQUEST,
            "Manager must be assigned to a branch"
          )
        );
      }

      // Add branch filter to request for use in services
      req.branchFilter = {
        branchId: user.branchId,
        role: user.role,
      };
    } else {
      // For other roles, no branch filtering
      req.branchFilter = {
        role: user.role,
      };
    }

    next();
  } catch (error) {
    next(
      new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Error applying branch filter"
      )
    );
  }
};

/**
 * Helper function to get branch filter for database queries
 * @param req - Express request object
 * @returns Branch filter object or null
 */
export const getBranchFilter = (req: Request) => {
  return req.branchFilter || null;
};

/**
 * Helper function to apply branch filter to Prisma where clause
 * @param whereClause - Existing where clause
 * @param req - Express request object
 * @returns Modified where clause with branch filtering
 */
export const applyBranchFilter = (whereClause: any, req: Request) => {
  const branchFilter = getBranchFilter(req);

  if (branchFilter?.branchId) {
    // For managers, filter by their branch
    return {
      ...whereClause,
      branchId: branchFilter.branchId,
    };
  }

  return whereClause;
};

/**
 * Helper function to apply branch filter to nested relations
 * @param includeClause - Existing include clause
 * @param req - Express request object
 * @returns Modified include clause with branch filtering
 */
export const applyBranchFilterToInclude = (
  includeClause: any,
  req: Request
) => {
  const branchFilter = getBranchFilter(req);

  if (branchFilter?.branchId) {
    // For managers, filter nested relations by their branch
    const addBranchFilterToNested = (obj: any): any => {
      if (typeof obj !== "object" || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(addBranchFilterToNested);
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === "where") {
          result[key] = {
            ...(value as any),
            branchId: branchFilter.branchId,
          };
        } else {
          result[key] = addBranchFilterToNested(value as any);
        }
      }
      return result;
    };

    return addBranchFilterToNested(includeClause);
  }

  return includeClause;
};
