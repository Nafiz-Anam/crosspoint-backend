import { Request, Response, NextFunction } from "express";
import { TokenType } from "@prisma/client";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";

/**
 * Middleware to validate session and check if it's still active
 * This ensures that only one session per user is active at a time
 */
const sessionValidation =
  () => async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip session validation for certain routes
      const skipRoutes = [
        "/auth/login",
        "/auth/register",
        "/auth/forgot-password",
        "/auth/reset-password",
      ];
      if (skipRoutes.some((route) => req.path.startsWith(route))) {
        return next();
      }

      // Get the authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Decode the JWT token to get the user ID
      const jwt = require("jsonwebtoken");
      const config = require("../config/config");

      let payload;
      try {
        payload = jwt.verify(token, config.jwt.secret);
      } catch (error) {
        return next();
      }

      if (!payload || !payload.sub) {
        return next();
      }

      const userId = payload.sub;

      // Check if the user has any active sessions
      const activeSession = await prisma.token.findFirst({
        where: {
          employeeId: userId,
          type: TokenType.REFRESH,
          isActive: true,
          blacklisted: false,
          expires: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc", // Get the most recent session
        },
      });

      if (!activeSession) {
        // No active session found, user needs to login again
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "No active session found. Please login again."
        );
      }

      // Check if the current request is from the most recent session
      // This is a simple check - in a more sophisticated system, you might want to
      // include session ID in the access token or use a different approach
      const sessionId = req.headers["x-session-id"] as string;

      if (sessionId && activeSession.sessionId !== sessionId) {
        // Request is from an older session, invalidate it
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Session expired. Another device has logged in with this account."
        );
      }

      // Add session info to request for use in other middlewares
      req.sessionInfo = {
        sessionId: activeSession.sessionId,
        deviceInfo: activeSession.deviceInfo,
        ipAddress: activeSession.ipAddress,
        userAgent: activeSession.userAgent,
      };

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(
          new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Session validation failed"
          )
        );
      }
    }
  };

export default sessionValidation;
