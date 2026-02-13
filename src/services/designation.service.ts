import { Designation } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import prisma from "../client";

// Create a new designation
const createDesignation = async (data: {
  name: string;
  departmentId: string;
  description?: string;
  isActive?: boolean;
}): Promise<Designation> => {
  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id: data.departmentId },
  });

  if (!department) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Department not found");
  }

  // Check if designation with same name in same department already exists
  const existing = await prisma.designation.findFirst({
    where: {
      name: data.name,
      departmentId: data.departmentId,
    },
  });

  if (existing) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Designation with this name already exists in this department"
    );
  }

  const designation = await prisma.designation.create({
    data: {
      name: data.name,
      departmentId: data.departmentId,
      description: data.description,
      isActive: data.isActive ?? true,
    },
    include: {
      department: true,
    },
  });

  return designation;
};

// Get all designations
const getAllDesignations = async (): Promise<Designation[]> => {
  return prisma.designation.findMany({
    include: {
      department: true,
    },
    orderBy: { name: "asc" },
  });
};

// Get designations with pagination
const getDesignationsWithPagination = async (options: {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortType: "asc" | "desc";
  departmentId?: string;
  isActive?: string;
}) => {
  const { page, limit, search, sortBy, sortType, departmentId, isActive } = options;
  const skip = (page - 1) * limit;

  // Build where clause
  let whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
      { department: { name: { contains: search, mode: "insensitive" as const } } },
    ];
  }

  if (departmentId) {
    whereClause.departmentId = departmentId;
  }

  if (isActive !== undefined && isActive !== "") {
    whereClause.isActive = isActive === "true";
  }

  // Build orderBy clause
  const orderByClause = {
    [sortBy]: sortType,
  };

  // Get total count
  const total = await prisma.designation.count({ where: whereClause });

  // Get paginated data
  const designations = await prisma.designation.findMany({
    where: whereClause,
    orderBy: orderByClause,
    skip,
    take: limit,
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          employees: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: designations,
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

// Get active designations only (for dropdowns)
const getActiveDesignations = async (departmentId?: string): Promise<Designation[]> => {
  const whereClause: any = { isActive: true };
  if (departmentId) {
    whereClause.departmentId = departmentId;
  }

  return prisma.designation.findMany({
    where: whereClause,
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
};

// Get designation by ID
const getDesignationById = async (id: string): Promise<Designation> => {
  const designation = await prisma.designation.findUnique({
    where: { id },
    include: {
      department: true,
      _count: {
        select: {
          employees: true,
        },
      },
    },
  });

  if (!designation) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Designation not found");
  }

  return designation;
};

// Update designation
const updateDesignation = async (
  id: string,
  updateData: Partial<{
    name: string;
    departmentId: string;
    description: string;
    isActive: boolean;
  }>
): Promise<Designation> => {
  const designation = await getDesignationById(id);

  // Check if department is being updated
  if (updateData.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: updateData.departmentId },
    });

    if (!department) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Department not found");
    }
  }

  // Check if name is being updated and if it conflicts with existing
  if (updateData.name) {
    const targetDepartmentId = updateData.departmentId || designation.departmentId;
    const existing = await prisma.designation.findFirst({
      where: {
        name: updateData.name,
        departmentId: targetDepartmentId,
        id: { not: id },
      },
    });

    if (existing) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "Designation with this name already exists in this department"
      );
    }
  }

  const updated = await prisma.designation.update({
    where: { id },
    data: updateData,
    include: {
      department: true,
    },
  });

  return updated;
};

// Delete designation
const deleteDesignation = async (id: string): Promise<void> => {
  const designation = await getDesignationById(id);

  // Check if designation has employees
  const employeeCount = await prisma.employee.count({
    where: { designationId: id },
  });

  if (employeeCount > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot delete designation. It has ${employeeCount} employee(s) assigned. Please reassign employees first.`
    );
  }

  await prisma.designation.delete({ where: { id } });
};

export default {
  createDesignation,
  getAllDesignations,
  getDesignationsWithPagination,
  getActiveDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
};
