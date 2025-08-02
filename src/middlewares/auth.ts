// src/middlewares/auth.ts

import passport from "passport";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import { NextFunction, Request, Response } from "express";
import {
  Permission as PrismaPermission,
  Role,
  Employee as PrismaEmployee,
} from "@prisma/client"; // Import Prisma types

// Define a type for your authenticated employee that includes permissions
// This type should match what your jwtVerify function returns.
interface AuthenticatedEmployee extends PrismaEmployee {
  id: string;
  email: string;
  name: string | null;
  role: Role; // Use your Prisma Role enum type
  employeePermissions: PrismaPermission[]; // Array of permission strings (from Prisma enum)
}

const verifyCallback =
  (
    req: Request,
    resolve: (value?: unknown) => void,
    reject: (reason?: unknown) => void
  ) =>
  async (err: unknown, user: AuthenticatedEmployee | false, info: unknown) => {
    // Type 'user' correctly
    if (err || info || !user) {
      console.error("Authentication failed:", err || info); // Log error/info for debugging
      return reject(
        new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate")
      );
    }

    req.employee = user; // Attach the full employee object (including permissions)
    req.employeePermissions = user.employeePermissions; // Explicitly attach the permissions array

    resolve();
  };

const auth = () => async (req: Request, res: Response, next: NextFunction) => {
  return new Promise((resolve, reject) => {
    passport.authenticate(
      "jwt",
      { session: false },
      verifyCallback(req, resolve, reject)
    )(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};

export default auth;
