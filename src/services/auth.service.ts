import httpStatus from "http-status";
import tokenService from "./token.service";
import employeeService from "./employee.service";
import ApiError from "../utils/ApiError";
import { TokenType, Employee } from "@prisma/client";
import prisma from "../client";
import { encryptPassword, isPasswordMatch } from "../utils/encryption";
import { AuthTokensResponse } from "../types/response";
import exclude from "../utils/exclude";
import { allRoles } from "../config/roles";

/**
 * Login with employee email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Omit<Employee, 'password'>>}
 */
const loginEmployeeWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<Omit<Employee, "password">> => {
  const employee = await employeeService.getEmployeeByEmail(email, [
    "id",
    "email",
    "name",
    "password",
    "role",
    "permissions",
    "isEmailVerified",
    "createdAt",
    "updatedAt",
  ]);
  if (
    !employee ||
    !(await isPasswordMatch(password, employee.password as string))
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  // Ensure user has role-based permissions (fallback if database doesn't have them)
  const rolePermissions = allRoles[employee.role] || [];
  const userWithPermissions = {
    ...employee,
    permissions:
      employee.permissions && employee.permissions.length > 0
        ? employee.permissions
        : rolePermissions,
  };

  return exclude(userWithPermissions, ["password"]) as any;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
const logout = async (refreshToken: string): Promise<void> => {
  const refreshTokenData = await prisma.token.findFirst({
    where: {
      token: refreshToken,
      type: TokenType.REFRESH,
      blacklisted: false,
    },
  });
  if (!refreshTokenData) {
    throw new ApiError(httpStatus.NOT_FOUND, "Refresh token not found");
  }
  await prisma.token.delete({ where: { id: refreshTokenData.id } });
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<AuthTokensResponse>}
 */
const refreshAuth = async (
  refreshToken: string
): Promise<AuthTokensResponse> => {
  try {
    const refreshTokenData = await tokenService.verifyToken(
      refreshToken,
      TokenType.REFRESH
    );
    const { employeeId } = refreshTokenData;
    await prisma.token.delete({ where: { id: refreshTokenData.id } });
    return tokenService.generateAuthTokens({ id: employeeId });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPassword = async (
  resetPasswordToken: string,
  newPassword: string
): Promise<void> => {
  try {
    const resetPasswordTokenData = await tokenService.verifyToken(
      resetPasswordToken,
      TokenType.RESET_PASSWORD
    );
    const employee = await employeeService.getEmployeeById(
      resetPasswordTokenData.employeeId
    );
    if (!employee) {
      throw new Error();
    }
    const encryptedPassword = await encryptPassword(newPassword);
    await employeeService.updateEmployeeById(employee.id, {
      password: encryptedPassword,
    });
    await prisma.token.deleteMany({
      where: { employeeId: employee.id, type: TokenType.RESET_PASSWORD },
    });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password reset failed");
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<void>}
 */
const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
  try {
    const verifyEmailTokenData = await tokenService.verifyToken(
      verifyEmailToken,
      TokenType.VERIFY_EMAIL
    );
    await prisma.token.deleteMany({
      where: {
        employeeId: verifyEmailTokenData.employeeId,
        type: TokenType.VERIFY_EMAIL,
      },
    });
    await employeeService.updateEmployeeById(verifyEmailTokenData.employeeId, {
      isEmailVerified: true,
    });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email verification failed");
  }
};

export default {
  loginEmployeeWithEmailAndPassword,
  isPasswordMatch,
  encryptPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
};
