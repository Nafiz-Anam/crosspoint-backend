import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import {
  authService,
  employeeService,
  tokenService,
  emailService,
} from "../services";
import exclude from "../utils/exclude";
import sendResponse from "../utils/responseHandler";
import prisma from "../client";
import { Employee } from "@prisma/client";

const register = catchAsync(async (req, res) => {
  const clientType = req.headers["x-client-type"];
  const { email, password } = req.body;
  const employee = await employeeService.registerEmployee(email, password);
  const userWithoutPassword = exclude(employee, [
    "password",
    "createdAt",
    "updatedAt",
  ]);
  const tokens = await tokenService.generateAuthTokens(employee);

  if (!tokens.refresh) {
    return sendResponse(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      false,
      null,
      "Error generating tokens"
    );
  }

  if (clientType === "web") {
    // For web clients, set refresh token in an HttpOnly cookie
    res.cookie("refreshToken", tokens?.refresh?.token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(tokens?.refresh?.expires),
    });
    // Send only the access token in the response body for web clients
    sendResponse(
      res,
      httpStatus.CREATED,
      true,
      { user: userWithoutPassword, accessToken: tokens.access.token },
      "User registered successfully"
    );
  } else if (clientType === "mobile") {
    sendResponse(
      res,
      httpStatus.CREATED,
      true,
      { user: userWithoutPassword, tokens },
      "User registered successfully"
    );
  } else {
    sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      "Invalid or missing client type header"
    );
  }
});

const login = catchAsync(async (req, res) => {
  const clientType = req.headers["x-client-type"];
  const { email, password } = req.body;

  // Check if user already has active sessions
  const user = await authService.loginEmployeeWithEmailAndPassword(
    email,
    password
  );

  const hasActiveSessions = await tokenService.hasActiveSessions(user.id);

  if (hasActiveSessions) {
    // Invalidate all existing sessions for single-session enforcement
    await tokenService.invalidateAllUserSessions(user.id);
  }

  // Extract session data from request
  const sessionData = {
    deviceInfo: (req.headers["x-device-info"] as string) || "Unknown Device",
    ipAddress: req.ip || req.connection.remoteAddress || "Unknown IP",
    userAgent: req.headers["user-agent"] || "Unknown User Agent",
  };

  const tokens = await tokenService.generateAuthTokens(user, sessionData);

  if (!tokens.refresh) {
    return sendResponse(
      res,
      httpStatus.INTERNAL_SERVER_ERROR,
      false,
      null,
      "Error generating tokens"
    );
  }

  if (clientType === "web") {
    // For web clients, set refresh token in an HttpOnly cookie
    res.cookie("refreshToken", tokens?.refresh?.token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(tokens?.refresh?.expires),
    });
    // Send only the access token in the response body for web clients
    sendResponse(
      res,
      httpStatus.OK,
      true,
      {
        user,
        accessToken: tokens.access,
        sessionId: tokens.sessionId,
        previousSessionsTerminated: hasActiveSessions,
      },
      hasActiveSessions
        ? "User logged in successfully. Previous sessions have been terminated."
        : "User logged in successfully"
    );
  } else if (clientType === "mobile") {
    sendResponse(
      res,
      httpStatus.OK,
      true,
      {
        user,
        tokens,
        sessionId: tokens.sessionId,
        previousSessionsTerminated: hasActiveSessions,
      },
      hasActiveSessions
        ? "User logged in successfully. Previous sessions have been terminated."
        : "User logged in successfully"
    );
  } else {
    sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      "Invalid or missing client type header"
    );
  }
});

const logout = catchAsync(async (req, res) => {
  // Try to get the refresh token from cookies first
  let refreshToken = req.cookies["refreshToken"];

  // If not found in cookies, try to get it from the request body
  if (!refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  // Proceed only if a refresh token is found either in cookies or the body
  if (!refreshToken) {
    return sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      "No refresh token provided"
    );
  }

  // Call the authService logout function with the refresh token
  await authService.logout(refreshToken);

  // Optionally clear the refresh token cookie for web clients
  if (req.cookies["refreshToken"]) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  }

  // Send a success response
  sendResponse(res, httpStatus.OK, true, null, "User logged out successfully");
});

const refreshTokens = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      "Refresh token is required"
    );
  }

  // Extract session data from request headers
  const sessionData = {
    deviceInfo: (req.headers["x-device-info"] as string) || "Unknown Device",
    ipAddress: req.ip || req.connection.remoteAddress || "Unknown IP",
    userAgent: req.headers["user-agent"] || "Unknown User Agent",
  };

  const tokens = await authService.refreshAuth(refreshToken, sessionData);

  // Set refresh token as cookie for web clients
  const clientType = req.headers["x-client-type"];
  if (clientType === "web" && tokens.refresh) {
    res.cookie("refreshToken", tokens.refresh.token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(tokens.refresh.expires),
    });
  }

  sendResponse(
    res,
    httpStatus.OK,
    true,
    {
      accessToken: tokens.access,
      sessionId: tokens.sessionId,
    },
    "Tokens refreshed successfully"
  );
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(
    req.body.email
  );
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token as string, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const employee = req.employee as Employee;
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(
    employee
  );
  await emailService.sendVerificationEmail(employee.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token as string);
  res.status(httpStatus.NO_CONTENT).send();
});

const generateResetPasswordOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  const { otp, expiresAt } = await authService.generateResetPasswordOTP(email);

  // Send OTP via email
  await emailService.sendResetPasswordOTP(email, otp);

  res.status(httpStatus.OK).json({
    success: true,
    message: "OTP sent to your email",
    data: {
      expiresAt: expiresAt.toISOString(),
    },
  });
});

const verifyResetPasswordOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  await authService.verifyResetPasswordOTP(email, otp);

  res.status(httpStatus.OK).json({
    success: true,
    message: "OTP verified successfully",
  });
});

const resetPasswordWithOTP = catchAsync(async (req, res) => {
  const { email, otp, password } = req.body;
  await authService.resetPasswordWithOTP(email, otp, password);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Password reset successfully",
  });
});

const getActiveSessions = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const sessions = await tokenService.getActiveSessions(userId);

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { sessions },
    "Active sessions retrieved successfully"
  );
});

const terminateSession = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  // Verify the session belongs to the current user
  const session = await prisma.token.findFirst({
    where: {
      sessionId,
      employeeId: userId,
      type: "REFRESH",
      isActive: true,
    },
  });

  if (!session) {
    return sendResponse(
      res,
      httpStatus.NOT_FOUND,
      false,
      null,
      "Session not found"
    );
  }

  await tokenService.invalidateSession(sessionId);

  sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "Session terminated successfully"
  );
});

const terminateAllSessions = catchAsync(async (req, res) => {
  const userId = req.user.id;

  await tokenService.invalidateAllUserSessions(userId);

  sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "All sessions terminated successfully"
  );
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  generateResetPasswordOTP,
  verifyResetPasswordOTP,
  resetPasswordWithOTP,
  getActiveSessions,
  terminateSession,
  terminateAllSessions,
};
