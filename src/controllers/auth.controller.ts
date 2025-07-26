import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import {
  authService,
  userService,
  tokenService,
  emailService,
} from "../services";
import exclude from "../utils/exclude";
import { User } from "@prisma/client";
import sendResponse from "../utils/responseHandler";

const register = catchAsync(async (req, res) => {
  const clientType = req.headers["x-client-type"];
  const { email, password } = req.body;
  const user = await userService.createUser(email, password);
  const userWithoutPassword = exclude(user, [
    "password",
    "createdAt",
    "updatedAt",
  ]);
  const tokens = await tokenService.generateAuthTokens(user);

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
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);

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
      { user, accessToken: tokens.access.token },
      "User logged in successfully"
    );
  } else if (clientType === "mobile") {
    sendResponse(
      res,
      httpStatus.OK,
      true,
      { user, tokens },
      "User logged in successfully"
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
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
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
  const user = req.user as User;
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
  await emailService.sendVerificationEmail(user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token as string);
  res.status(httpStatus.NO_CONTENT).send();
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
};
