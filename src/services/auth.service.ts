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
    "branchId",
    "createdAt",
    "updatedAt",
  ]);
  console.log("🔍 Login attempt for:", email);
  console.log("🔍 Stored password length:", employee?.password?.length);
  console.log(
    "🔍 Stored password starts with:",
    employee?.password?.substring(0, 10)
  );

  if (!employee) {
    console.log("❌ Login failed: Employee not found");
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  const passwordMatch = await isPasswordMatch(
    password,
    employee.password as string
  );
  console.log("🔍 Password match result:", passwordMatch);

  if (!passwordMatch) {
    console.log("❌ Login failed: Password mismatch");
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  console.log("✅ Login successful for:", email);

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

/**
 * Generate OTP for password reset
 * @param {string} email
 * @returns {Promise<{otp: string, expiresAt: Date}>}
 */
const generateResetPasswordOTP = async (
  email: string
): Promise<{ otp: string; expiresAt: Date }> => {
  const employee = await employeeService.getEmployeeByEmail(email);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Email not found");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP in database
  await prisma.otp.upsert({
    where: {
      email: email,
    },
    update: {
      otp: otp,
      expiresAt: expiresAt,
      attempts: 0,
    },
    create: {
      email: email,
      otp: otp,
      expiresAt: expiresAt,
      attempts: 0,
    },
  });

  return { otp, expiresAt };
};

/**
 * Verify OTP for password reset
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<boolean>}
 */
const verifyResetPasswordOTP = async (
  email: string,
  otp: string
): Promise<boolean> => {
  const otpRecord = await prisma.otp.findUnique({
    where: {
      email: email,
    },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, "OTP not found");
  }

  // Check if OTP has expired
  if (new Date() > otpRecord.expiresAt) {
    await prisma.otp.delete({
      where: { email: email },
    });
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP has expired");
  }

  // Check if too many attempts
  if (otpRecord.attempts >= 3) {
    await prisma.otp.delete({
      where: { email: email },
    });
    throw new ApiError(httpStatus.BAD_REQUEST, "Too many failed attempts");
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    await prisma.otp.update({
      where: { email: email },
      data: { attempts: otpRecord.attempts + 1 },
    });
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  // OTP is valid, mark as verified but don't delete yet
  await prisma.otp.update({
    where: { email: email },
    data: { verified: true },
  });

  return true;
};

/**
 * Reset password with OTP
 * @param {string} email
 * @param {string} otp
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetPasswordWithOTP = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<void> => {
  // Check if OTP exists and is verified
  const otpRecord = await prisma.otp.findUnique({
    where: { email: email },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, "OTP not found");
  }

  if (!otpRecord.verified) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP not verified");
  }

  if (otpRecord.otp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  // Check if OTP has expired
  if (new Date() > otpRecord.expiresAt) {
    await prisma.otp.delete({ where: { email: email } });
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP has expired");
  }

  // Get employee and update password
  const employee = await employeeService.getEmployeeByEmail(email);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }

  const encryptedPassword = await encryptPassword(newPassword);
  console.log(
    "🔐 Password reset - Original password length:",
    newPassword.length
  );
  console.log(
    "🔐 Password reset - Encrypted password length:",
    encryptedPassword.length
  );
  console.log(
    "🔐 Password reset - Encrypted password starts with:",
    encryptedPassword.substring(0, 10)
  );

  await employeeService.updateEmployeeById(employee.id, {
    password: encryptedPassword,
  });

  console.log("✅ Password updated successfully for:", email);

  // Delete OTP after successful password reset
  await prisma.otp.delete({
    where: { email: email },
  });
};

export default {
  loginEmployeeWithEmailAndPassword,
  isPasswordMatch,
  encryptPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  generateResetPasswordOTP,
  verifyResetPasswordOTP,
  resetPasswordWithOTP,
};
