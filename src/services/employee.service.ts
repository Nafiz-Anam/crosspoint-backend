import { Employee, Permission, Prisma, Role } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import { encryptPassword } from "../utils/encryption";
import { branchService } from "../services";
import { allRoles } from "../config/roles";

const registerEmployee = async (email: string, password: string) => {
  // Check if email already exists
  if (await prisma.employee.findUnique({ where: { email } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  // Create basic employee with just email and password
  const employee = await prisma.employee.create({
    data: {
      email,
      password: await encryptPassword(password),
    },
  });

  return employee;
};

/**
 * Create an employee
 * @param {Object} employeeBody
 * @returns {Promise<Employee>}
 */
const createEmployee = async ({
  email,
  password,
  name,
  role = Role.EMPLOYEE,
  branchId,
  isActive = true,
  permissions = [],
}: {
  email: string;
  password: string;
  name: string;
  role?: Role;
  branchId?: string;
  isActive?: boolean;
  permissions?: Permission[];
}): Promise<
  Prisma.EmployeeGetPayload<{
    include: {
      branch: true;
    };
  }>
> => {
  // Check if email already exists
  if (await prisma.employee.findUnique({ where: { email } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  // Validate branch exists if required
  if (role !== Role.ADMIN) {
    if (!branchId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Branch is required for this role"
      );
    }

    if (!(await prisma.branch.findUnique({ where: { id: branchId } }))) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Branch not found");
    }
  }

  // Generate employee ID (only for non-admin roles)
  let employeeId: string | undefined;
  if (branchId) {
    try {
      employeeId = await branchService.generateEmployeeId(branchId);
      console.log(
        `Generated employee ID: ${employeeId} for branch: ${branchId}`
      );
    } catch (error) {
      console.error(
        `Failed to generate employee ID for branch ${branchId}:`,
        error
      );
      throw error;
    }
  }

  // Get role-based permissions if no specific permissions provided
  const rolePermissions = allRoles[role] || [];
  const finalPermissions =
    permissions.length > 0 ? permissions : rolePermissions;

  // Create employee with permissions (stored as enum array)
  try {
    const employee = await prisma.employee.create({
      data: {
        email,
        name,
        password: await encryptPassword(password),
        role,
        branchId,
        isActive,
        employeeId,
        permissions: finalPermissions, // Use role-based or provided permissions
      },
      include: {
        branch: true,
      },
    });
    return employee;
  } catch (error: any) {
    // Handle unique constraint violations
    if (error.code === "P2002") {
      if (error.meta?.target?.includes("employeeId")) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "Employee ID already exists. Please try again."
        );
      }
      if (error.meta?.target?.includes("email")) {
        throw new ApiError(httpStatus.CONFLICT, "Email already exists");
      }
    }
    throw error;
  }
};

/**
 * Query for employees
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryEmployees = async <Key extends keyof Employee>(
  filter: object,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
  keys: Key[] = [
    "id",
    "employeeId",
    "name",
    "email",
    "branchId",
    "role",
    "isActive",
    "permissions",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<Employee, Key>[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? "desc";
  const employees = await prisma.employee.findMany({
    where: filter,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
  });
  return employees as Pick<Employee, Key>[];
};

/**
 * Get employee by id
 * @param {ObjectId} id
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Employee, Key> | null>}
 */
const getEmployeeById = async <Key extends keyof Employee>(
  id: string,
  keys: Key[] = [
    "id",
    "email",
    "name",
    "password",
    "role",
    "isEmailVerified",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<Employee, Key> | null> => {
  return prisma.employee.findUnique({
    where: { id },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  }) as Promise<Pick<Employee, Key> | null>;
};

/**
 * Get employee by email
 * @param {string} email
 * @param {Array<Key>} keys
 * @returns {Promise<Pick<Employee, Key> | null>}
 */
const getEmployeeByEmail = async <Key extends keyof Employee>(
  email: string,
  keys: Key[] = [
    "id",
    "email",
    "name",
    "password",
    "role",
    "isEmailVerified",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<Employee, Key> | null> => {
  return prisma.employee.findUnique({
    where: { email },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  }) as Promise<Pick<Employee, Key> | null>;
};

/**
 * Update employee by id
 * @param {ObjectId} employeeId
 * @param {Object} updateBody
 * @returns {Promise<Employee>}
 */
const updateEmployeeById = async <Key extends keyof Employee>(
  employeeId: string,
  updateBody: Prisma.EmployeeUpdateInput,
  keys: Key[] = ["id", "email", "name", "role"] as Key[]
): Promise<Pick<Employee, Key> | null> => {
  const employee = await getEmployeeById(employeeId, ["id", "email", "name"]);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }
  if (
    updateBody.email &&
    (await getEmployeeByEmail(updateBody.email as string))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  const updatedEmployee = await prisma.employee.update({
    where: { id: employee.id },
    data: updateBody,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  });
  return updatedEmployee as Pick<Employee, Key> | null;
};

/**
 * Delete employee by id
 * @param {ObjectId} employeeId
 * @returns {Promise<Employee>}
 */
const deleteEmployeeById = async (employeeId: string): Promise<Employee> => {
  const employee = await getEmployeeById(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }
  await prisma.employee.delete({ where: { id: employee.id } });
  return employee;
};

export default {
  createEmployee,
  queryEmployees,
  getEmployeeById,
  getEmployeeByEmail,
  updateEmployeeById,
  deleteEmployeeById,
  registerEmployee,
};
