import { Employee, Prisma, Role } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import { encryptPassword } from "../utils/encryption";
import { branchService } from "../services";
import { allRoles } from "../config/roles";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import config from "../config/config";

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
      phone: "0000000000", // Default phone for basic employees
      dateOfBirth: new Date("1990-01-01"), // Default date of birth for basic employees
      nationalIdentificationNumber: `TEMP-${Date.now()}`, // Temporary national ID for basic employees
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
  phone,
  nationalIdentificationNumber,
  role = Role.EMPLOYEE,
  branchId,
  dateOfBirth,
  isActive = true,
}: {
  email: string;
  password: string;
  name: string;
  phone: string;
  nationalIdentificationNumber: string;
  role?: Role;
  branchId?: string;
  dateOfBirth: Date;
  isActive?: boolean;
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

  // Check if national identification number already exists
  if (nationalIdentificationNumber) {
    if (
      await prisma.employee.findUnique({
        where: { nationalIdentificationNumber },
      })
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Employee with this national identification number already exists"
      );
    }
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

  // Get role-based permissions
  const rolePermissions = allRoles[role] || [];

  // Create employee with role-based permissions
  try {
    const employee = await prisma.employee.create({
      data: {
        email,
        name,
        phone,
        nationalIdentificationNumber,
        password: await encryptPassword(password),
        role,
        branchId,
        dateOfBirth,
        isActive,
        employeeId,
        permissions: rolePermissions, // Use role-based permissions
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
 * @param {string} [currentUserRole] - Current user's role for filtering
 * @param {string} [currentUserBranchId] - Current user's branch ID for filtering
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
    "nationalIdentificationNumber",
    "dateOfBirth",
    "profileImage",
    "branchId",
    "role",
    "isActive",
    "isEmailVerified",
    "permissions",
    "createdAt",
    "updatedAt",
  ] as Key[],
  currentUserRole?: string,
  currentUserBranchId?: string
): Promise<Pick<Employee, Key>[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? "desc";

  // Apply branch filtering for managers
  let whereClause = { ...filter };
  if (currentUserRole === "MANAGER" && currentUserBranchId) {
    whereClause = {
      ...whereClause,
      branchId: currentUserBranchId,
    };
  }

  const employees = await prisma.employee.findMany({
    where: whereClause,
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : { createdAt: "desc" },
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
    "employeeId",
    "email",
    "name",
    "password",
    "nationalIdentificationNumber",
    "dateOfBirth",
    "profileImage",
    "branchId",
    "role",
    "isEmailVerified",
    "isActive",
    "createdAt",
    "updatedAt",
  ] as Key[]
): Promise<Pick<Employee, Key> | null> => {
  return prisma.employee.findUnique({
    where: { id },
    select: {
      ...keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
      branch: {
        select: {
          id: true,
          name: true,
          branchId: true,
        },
      },
    },
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
  keys: Key[] = ["id", "email", "name", "role", "password"] as Key[]
): Promise<Pick<Employee, Key> | null> => {
  const employee = await getEmployeeById(employeeId, ["id", "email", "name"]);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }
  if (updateBody.email) {
    const existingEmployee = await getEmployeeByEmail(
      updateBody.email as string
    );
    if (existingEmployee && existingEmployee.id !== employee.id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }
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
 * Automatically deletes all associated tokens and attendances
 * Blocks deletion if employee has assigned invoices or tasks
 * @param {string} employeeId
 * @returns {Promise<Employee>}
 */
const deleteEmployeeById = async (employeeId: string): Promise<Employee> => {
  const employee = await getEmployeeById(employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }

  // Check if employee has associated invoices
  const invoiceCount = await prisma.invoice.count({
    where: { employeeId: employee.id },
  });

  if (invoiceCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete employee. Employee has ${invoiceCount} associated invoice(s). Please reassign or delete the invoices first.`
    );
  }

  // Check if employee has assigned tasks
  const taskCount = await prisma.task.count({
    where: { assignedEmployeeId: employee.id },
  });

  if (taskCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete employee. Employee has ${taskCount} assigned task(s). Please reassign or complete the tasks first.`
    );
  }

  // Delete all tokens associated with this employee
  // This explicitly cleans up tokens before deletion
  // The schema also has onDelete: Cascade as a backup
  await prisma.token.deleteMany({
    where: { employeeId: employee.id },
  });

  // Prisma will handle cascade deletion for:
  // - Attendance records (via onDelete: Cascade in schema)

  await prisma.employee.delete({ where: { id: employee.id } });
  return employee;
};

/**
 * Upload profile image
 * @param {any} file - Uploaded file
 * @returns {Promise<string>} - Public URL of uploaded image
 */
const uploadProfileImage = async (file: any): Promise<string> => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "profiles"
    );
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `profile-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    const writeFile = promisify(fs.writeFile);
    await writeFile(filePath, file.buffer);

    // Return the full public URL
    const profileImageUrl = `${config.baseUrl}/uploads/profiles/${fileName}`;

    return profileImageUrl;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to upload profile image"
    );
  }
};

// Get all employees with pagination
const getEmployeesWithPagination = async (
  options: {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortType: "asc" | "desc";
    role?: string;
    isActive?: string;
    branchId?: string;
  },
  excludeConditions: any[] = [],
  currentUserRole?: string,
  currentUserBranchId?: string
) => {
  const { page, limit, search, sortBy, sortType, role, isActive, branchId } =
    options;
  const skip = (page - 1) * limit;

  // Build where clause for search
  let whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
      { employeeId: { contains: search, mode: "insensitive" as const } },
      {
        nationalIdentificationNumber: {
          contains: search,
          mode: "insensitive" as const,
        },
      },
    ];
  }

  // Apply role filtering
  if (role) {
    whereClause.role = role;
  }

  // Apply status filtering
  if (isActive !== undefined && isActive !== "") {
    whereClause.isActive = isActive === "true";
  }

  // Apply branch filtering
  if (branchId) {
    whereClause.branchId = branchId;
  }

  // Apply exclude conditions
  if (excludeConditions.length > 0) {
    whereClause.AND = excludeConditions;
  }

  // Apply branch filtering for managers (override any branchId filter)
  if (currentUserRole === "MANAGER" && currentUserBranchId) {
    whereClause.branchId = currentUserBranchId;
  }

  // Build orderBy clause
  const orderByClause = {
    [sortBy]: sortType,
  };

  // Get total count for pagination
  const total = await prisma.employee.count({ where: whereClause });

  // Get paginated data
  const employees = await prisma.employee.findMany({
    where: whereClause,
    orderBy: orderByClause,
    skip,
    take: limit,
    include: {
      branch: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: employees,
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

export default {
  createEmployee,
  queryEmployees,
  getEmployeesWithPagination,
  getEmployeeById,
  getEmployeeByEmail,
  updateEmployeeById,
  deleteEmployeeById,
  registerEmployee,
  uploadProfileImage,
};
