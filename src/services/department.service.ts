import { Department } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import prisma from "../client";

// Create a new department
const createDepartment = async (data: {
  name: string;
  description?: string;
  isActive?: boolean;
}): Promise<Department> => {
  // Check if department with same name already exists
  const existing = await prisma.department.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, "Department with this name already exists");
  }

  const department = await prisma.department.create({
    data: {
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
    },
  });

  return department;
};

// Get all departments
const getAllDepartments = async (): Promise<Department[]> => {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
  });
};

// Get departments with pagination
const getDepartmentsWithPagination = async (options: {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortType: "asc" | "desc";
  isActive?: string;
}) => {
  const { page, limit, search, sortBy, sortType, isActive } = options;
  const skip = (page - 1) * limit;

  // Build where clause
  let whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
    ];
  }

  if (isActive !== undefined && isActive !== "") {
    whereClause.isActive = isActive === "true";
  }

  // Build orderBy clause
  const orderByClause = {
    [sortBy]: sortType,
  };

  // Get total count
  const total = await prisma.department.count({ where: whereClause });

  // Get paginated data
  const departments = await prisma.department.findMany({
    where: whereClause,
    orderBy: orderByClause,
    skip,
    take: limit,
    include: {
      _count: {
        select: {
          employees: true,
          designations: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: departments,
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

// Get active departments only (for dropdowns)
const getActiveDepartments = async (): Promise<Department[]> => {
  return prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
};

// Get department by ID
const getDepartmentById = async (id: string): Promise<Department> => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          employees: true,
          designations: true,
        },
      },
    },
  });

  if (!department) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Department not found");
  }

  return department;
};

// Update department
const updateDepartment = async (
  id: string,
  updateData: Partial<{
    name: string;
    description: string;
    isActive: boolean;
  }>
): Promise<Department> => {
  const department = await getDepartmentById(id);

  // Check if name is being updated and if it conflicts with existing
  if (updateData.name && updateData.name !== department.name) {
    const existing = await prisma.department.findUnique({
      where: { name: updateData.name },
    });

    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, "Department with this name already exists");
    }
  }

  const updated = await prisma.department.update({
    where: { id },
    data: updateData,
  });

  return updated;
};

// Delete department
const deleteDepartment = async (id: string): Promise<void> => {
  const department = await getDepartmentById(id);

  // Check if department has employees
  const employeeCount = await prisma.employee.count({
    where: { departmentId: id },
  });

  if (employeeCount > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot delete department. It has ${employeeCount} employee(s) assigned. Please reassign employees first.`
    );
  }

  // Check if department has designations
  const designationCount = await prisma.designation.count({
    where: { departmentId: id },
  });

  if (designationCount > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot delete department. It has ${designationCount} designation(s). Please delete or reassign designations first.`
    );
  }

  await prisma.department.delete({ where: { id } });
};

export default {
  createDepartment,
  getAllDepartments,
  getDepartmentsWithPagination,
  getActiveDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
