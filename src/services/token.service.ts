import jwt from "jsonwebtoken";
import moment, { Moment } from "moment";
import httpStatus from "http-status";
import config from "../config/config";
import userService from "./employee.service";
import ApiError from "../utils/ApiError";
import { Token, TokenType } from "@prisma/client";
import prisma from "../client";
import { AuthTokensResponse } from "../types/response";

/**
 * Generate token
 * @param {string} employeeId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (
  employeeId: string,
  expires: Moment,
  type: TokenType,
  secret = config.jwt.secret
): string => {
  const payload = {
    sub: employeeId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {string} employeeId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @param {Object} [sessionData] - Session tracking data
 * @returns {Promise<Token>}
 */
const saveToken = async (
  token: string,
  employeeId: string,
  expires: Moment,
  type: TokenType,
  blacklisted = false,
  sessionData?: {
    sessionId?: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<Token> => {
  const createdToken = await prisma.token.create({
    data: {
      token,
      employeeId: employeeId,
      expires: expires.toDate(),
      type,
      blacklisted,
      sessionId: sessionData?.sessionId,
      deviceInfo: sessionData?.deviceInfo,
      ipAddress: sessionData?.ipAddress,
      userAgent: sessionData?.userAgent,
    },
  });
  return createdToken;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token: string, type: TokenType): Promise<Token> => {
  const payload = jwt.verify(token, config.jwt.secret);
  // Ensure payload is an object and has a 'sub' property of type string
  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.sub !== "string"
  ) {
    throw new Error("Invalid token payload");
  }
  const employeeId = payload.sub;
  const tokenData = await prisma.token.findFirst({
    where: { token, type, employeeId, blacklisted: false },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          branchId: true,
        },
      },
    },
  });
  if (!tokenData) {
    throw new Error("Token not found");
  }
  return tokenData;
};

/**
 * Generate auth tokens
 * @param {Employee} employee
 * @param {Object} [sessionData] - Session tracking data
 * @returns {Promise<AuthTokensResponse>}
 */
const generateAuthTokens = async (
  employee: { id: string },
  sessionData?: {
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<AuthTokensResponse> => {
  const accessTokenExpires = moment().add(
    config.jwt.accessExpirationMinutes,
    "minutes"
  );
  const accessToken = generateToken(
    employee.id,
    accessTokenExpires,
    TokenType.ACCESS
  );

  const refreshTokenExpires = moment().add(
    config.jwt.refreshExpirationDays,
    "days"
  );
  const refreshToken = generateToken(
    employee.id,
    refreshTokenExpires,
    TokenType.REFRESH
  );

  // Generate session ID for tracking
  const sessionId = generateSessionId();

  await saveToken(
    refreshToken,
    employee.id,
    refreshTokenExpires,
    TokenType.REFRESH,
    false,
    {
      sessionId,
      deviceInfo: sessionData?.deviceInfo,
      ipAddress: sessionData?.ipAddress,
      userAgent: sessionData?.userAgent,
    }
  );

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
    sessionId,
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email: string): Promise<string> => {
  const employee = await userService.getEmployeeByEmail(email);
  if (!employee) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No employees found with this email"
    );
  }
  const expires = moment().add(
    config.jwt.resetPasswordExpirationMinutes,
    "minutes"
  );
  const resetPasswordToken = generateToken(
    employee.id as string,
    expires,
    TokenType.RESET_PASSWORD
  );
  await saveToken(
    resetPasswordToken,
    employee.id as string,
    expires,
    TokenType.RESET_PASSWORD
  );
  return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {Employee} employee
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (employee: {
  id: string;
}): Promise<string> => {
  const expires = moment().add(
    config.jwt.verifyEmailExpirationMinutes,
    "minutes"
  );
  const verifyEmailToken = generateToken(
    employee.id,
    expires,
    TokenType.VERIFY_EMAIL
  );
  await saveToken(
    verifyEmailToken,
    employee.id,
    expires,
    TokenType.VERIFY_EMAIL
  );
  return verifyEmailToken;
};

/**
 * Generate a unique session ID
 * @returns {string}
 */
const generateSessionId = (): string => {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Invalidate all active sessions for a user
 * @param {string} employeeId
 * @returns {Promise<void>}
 */
const invalidateAllUserSessions = async (employeeId: string): Promise<void> => {
  await prisma.token.updateMany({
    where: {
      employeeId,
      type: TokenType.REFRESH,
      isActive: true,
    },
    data: {
      isActive: false,
      blacklisted: true,
    },
  });
};

/**
 * Check if user has any active sessions
 * @param {string} employeeId
 * @returns {Promise<boolean>}
 */
const hasActiveSessions = async (employeeId: string): Promise<boolean> => {
  const activeSession = await prisma.token.findFirst({
    where: {
      employeeId,
      type: TokenType.REFRESH,
      isActive: true,
      blacklisted: false,
      expires: {
        gt: new Date(),
      },
    },
  });
  return !!activeSession;
};

/**
 * Get active session info for a user
 * @param {string} employeeId
 * @returns {Promise<Array>}
 */
const getActiveSessions = async (employeeId: string) => {
  return await prisma.token.findMany({
    where: {
      employeeId,
      type: TokenType.REFRESH,
      isActive: true,
      blacklisted: false,
      expires: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      sessionId: true,
      deviceInfo: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expires: true,
    },
  });
};

/**
 * Invalidate a specific session
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
const invalidateSession = async (sessionId: string): Promise<void> => {
  await prisma.token.updateMany({
    where: {
      sessionId,
      type: TokenType.REFRESH,
    },
    data: {
      isActive: false,
      blacklisted: true,
    },
  });
};

/**
 * Update session activity
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
const updateSessionActivity = async (sessionId: string): Promise<void> => {
  await prisma.token.updateMany({
    where: {
      sessionId,
      type: TokenType.REFRESH,
      isActive: true,
    },
    data: {
      // Update last activity timestamp by updating the token
      updatedAt: new Date(),
    },
  });
};

export default {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  generateSessionId,
  invalidateAllUserSessions,
  hasActiveSessions,
  getActiveSessions,
  invalidateSession,
  updateSessionActivity,
};
