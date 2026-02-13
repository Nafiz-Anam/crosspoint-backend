import { LeaveType, LeaveRequest, LeaveBalance, LeaveRequestStatus } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import prisma from "../client";

// ========== Leave Type Management ==========

// Create a new leave type
const createLeaveType = async (data: {
  name: string;
  code: string;
  description?: string;
  maxDays?: number;
  isPaid?: boolean;
  isActive?: boolean;
}): Promise<LeaveType> => {
  // Check if leave type with same name or code already exists
  const existingName = await prisma.leaveType.findUnique({
    where: { name: data.name },
  });

  if (existingName) {
    throw new ApiError(StatusCodes.CONFLICT, "Leave type with this name already exists");
  }

  const existingCode = await prisma.leaveType.findUnique({
    where: { code: data.code },
  });

  if (existingCode) {
    throw new ApiError(StatusCodes.CONFLICT, "Leave type with this code already exists");
  }

  const leaveType = await prisma.leaveType.create({
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      maxDays: data.maxDays,
      isPaid: data.isPaid ?? true,
      isActive: data.isActive ?? true,
    },
  });

  return leaveType;
};

// Get all leave types
const getAllLeaveTypes = async (): Promise<LeaveType[]> => {
  return prisma.leaveType.findMany({
    orderBy: { name: "asc" },
  });
};

// Get active leave types only
const getActiveLeaveTypes = async (): Promise<LeaveType[]> => {
  return prisma.leaveType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
};

// Get leave type by ID
const getLeaveTypeById = async (id: string): Promise<LeaveType> => {
  const leaveType = await prisma.leaveType.findUnique({
    where: { id },
  });

  if (!leaveType) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Leave type not found");
  }

  return leaveType;
};

// Update leave type
const updateLeaveType = async (
  id: string,
  updateData: Partial<{
    name: string;
    code: string;
    description: string;
    maxDays: number;
    isPaid: boolean;
    isActive: boolean;
  }>
): Promise<LeaveType> => {
  const leaveType = await getLeaveTypeById(id);

  // Check if name is being updated and conflicts
  if (updateData.name && updateData.name !== leaveType.name) {
    const existing = await prisma.leaveType.findUnique({
      where: { name: updateData.name },
    });

    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, "Leave type with this name already exists");
    }
  }

  // Check if code is being updated and conflicts
  if (updateData.code && updateData.code !== leaveType.code) {
    const existing = await prisma.leaveType.findUnique({
      where: { code: updateData.code },
    });

    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, "Leave type with this code already exists");
    }
  }

  const updated = await prisma.leaveType.update({
    where: { id },
    data: updateData,
  });

  return updated;
};

// Delete leave type
const deleteLeaveType = async (id: string): Promise<void> => {
  const leaveType = await getLeaveTypeById(id);

  // Check if leave type has leave requests
  const requestCount = await prisma.leaveRequest.count({
    where: { leaveTypeId: id },
  });

  if (requestCount > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot delete leave type. It has ${requestCount} leave request(s). Please handle the requests first.`
    );
  }

  await prisma.leaveType.delete({ where: { id } });
};

// ========== Leave Request Management ==========

// Calculate number of days between start and end date (inclusive)
const calculateDays = (startDate: Date, endDate: Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  return diffDays;
};

// Create a new leave request
const createLeaveRequest = async (data: {
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}): Promise<LeaveRequest> => {
  // Validate employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId },
  });

  if (!employee) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  // Validate leave type exists
  const leaveType = await getLeaveTypeById(data.leaveTypeId);

  // Validate dates
  if (data.endDate < data.startDate) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "End date must be after start date");
  }

  // Calculate days
  const days = calculateDays(data.startDate, data.endDate);

  // Check leave balance
  const currentYear = new Date().getFullYear();
  let leaveBalance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        year: currentYear,
      },
    },
  });

  // Create balance if it doesn't exist
  if (!leaveBalance) {
    const totalDays = leaveType.maxDays || 0;
    leaveBalance = await prisma.leaveBalance.create({
      data: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        year: currentYear,
        totalDays,
        usedDays: 0,
        pendingDays: 0,
        balance: totalDays,
      },
    });
  }

  // Check if enough balance (including pending)
  const availableBalance = leaveBalance.balance - leaveBalance.pendingDays;
  if (availableBalance < days) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Insufficient leave balance. Available: ${availableBalance} days, Requested: ${days} days`
    );
  }

  // Check max days limit if set
  if (leaveType.maxDays && days > leaveType.maxDays) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Leave request exceeds maximum allowed days (${leaveType.maxDays}) for this leave type`
    );
  }

  // Create leave request
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      days,
      reason: data.reason,
      status: LeaveRequestStatus.PENDING,
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
      leaveType: true,
    },
  });

  // Update pending days in balance
  await prisma.leaveBalance.update({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        year: currentYear,
      },
    },
    data: {
      pendingDays: {
        increment: days,
      },
      balance: {
        decrement: days,
      },
    },
  });

  return leaveRequest;
};

// Get leave requests with pagination
const getLeaveRequestsWithPagination = async (options: {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortType: "asc" | "desc";
  employeeId?: string;
  leaveTypeId?: string;
  status?: LeaveRequestStatus;
  startDate?: Date;
  endDate?: Date;
}) => {
  const { page, limit, search, sortBy, sortType, employeeId, leaveTypeId, status, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  // Build where clause
  let whereClause: any = {};

  if (employeeId) {
    whereClause.employeeId = employeeId;
  }

  if (leaveTypeId) {
    whereClause.leaveTypeId = leaveTypeId;
  }

  if (status) {
    whereClause.status = status;
  }

  if (startDate || endDate) {
    whereClause.OR = [];
    if (startDate) {
      whereClause.OR.push({ startDate: { gte: startDate } });
    }
    if (endDate) {
      whereClause.OR.push({ endDate: { lte: endDate } });
    }
  }

  if (search) {
    whereClause.OR = [
      ...(whereClause.OR || []),
      { employee: { name: { contains: search, mode: "insensitive" as const } } },
      { leaveType: { name: { contains: search, mode: "insensitive" as const } } },
      { reason: { contains: search, mode: "insensitive" as const } },
    ];
  }

  // Build orderBy clause
  const orderByClause = {
    [sortBy]: sortType,
  };

  // Get total count
  const total = await prisma.leaveRequest.count({ where: whereClause });

  // Get paginated data
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: whereClause,
    orderBy: orderByClause,
    skip,
    take: limit,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          email: true,
        },
      },
      leaveType: true,
    },
  });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: leaveRequests,
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

// Get leave request by ID
const getLeaveRequestById = async (id: string): Promise<LeaveRequest> => {
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          email: true,
        },
      },
      leaveType: true,
    },
  });

  if (!leaveRequest) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Leave request not found");
  }

  return leaveRequest;
};

// Approve leave request
const approveLeaveRequest = async (id: string, approvedBy: string): Promise<LeaveRequest> => {
  const leaveRequest = await getLeaveRequestById(id);

  if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Only pending leave requests can be approved");
  }

  const currentYear = new Date(leaveRequest.startDate).getFullYear();

  // Update leave request
  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: LeaveRequestStatus.APPROVED,
      approvedBy,
      approvedAt: new Date(),
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
      leaveType: true,
    },
  });

  // Update leave balance
  await prisma.leaveBalance.update({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: currentYear,
      },
    },
    data: {
      pendingDays: {
        decrement: leaveRequest.days,
      },
      usedDays: {
        increment: leaveRequest.days,
      },
    },
  });

  return updated;
};

// Reject leave request
const rejectLeaveRequest = async (id: string, rejectedBy: string, rejectionReason?: string): Promise<LeaveRequest> => {
  const leaveRequest = await getLeaveRequestById(id);

  if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Only pending leave requests can be rejected");
  }

  const currentYear = new Date(leaveRequest.startDate).getFullYear();

  // Update leave request
  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: LeaveRequestStatus.REJECTED,
      approvedBy: rejectedBy,
      rejectedAt: new Date(),
      rejectionReason,
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
      leaveType: true,
    },
  });

  // Update leave balance - return pending days to balance
  await prisma.leaveBalance.update({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: currentYear,
      },
    },
    data: {
      pendingDays: {
        decrement: leaveRequest.days,
      },
      balance: {
        increment: leaveRequest.days,
      },
    },
  });

  return updated;
};

// Cancel leave request
const cancelLeaveRequest = async (id: string, employeeId: string): Promise<LeaveRequest> => {
  const leaveRequest = await getLeaveRequestById(id);

  // Only employee who created the request or admin can cancel
  if (leaveRequest.employeeId !== employeeId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only cancel your own leave requests");
  }

  if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Only pending leave requests can be cancelled");
  }

  const currentYear = new Date(leaveRequest.startDate).getFullYear();

  // Update leave request
  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: LeaveRequestStatus.CANCELLED,
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
      leaveType: true,
    },
  });

  // Update leave balance - return pending days to balance
  await prisma.leaveBalance.update({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: currentYear,
      },
    },
    data: {
      pendingDays: {
        decrement: leaveRequest.days,
      },
      balance: {
        increment: leaveRequest.days,
      },
    },
  });

  return updated;
};

// ========== Leave Balance Management ==========

// Get leave balance for an employee
const getEmployeeLeaveBalance = async (employeeId: string, year?: number): Promise<LeaveBalance[]> => {
  const currentYear = year || new Date().getFullYear();

  return prisma.leaveBalance.findMany({
    where: {
      employeeId,
      year: currentYear,
    },
    include: {
      leaveType: true,
    },
    orderBy: {
      leaveType: {
        name: "asc",
      },
    },
  });
};

// Initialize leave balance for an employee (usually done when employee is created or leave type is added)
const initializeLeaveBalance = async (
  employeeId: string,
  leaveTypeId: string,
  year: number,
  totalDays: number
): Promise<LeaveBalance> => {
  const existing = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId,
        year,
      },
    },
  });

  if (existing) {
    // Update existing balance
    return prisma.leaveBalance.update({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year,
        },
      },
      data: {
        totalDays,
        balance: totalDays - existing.usedDays - existing.pendingDays,
      },
      include: {
        leaveType: true,
      },
    });
  }

  // Create new balance
  return prisma.leaveBalance.create({
    data: {
      employeeId,
      leaveTypeId,
      year,
      totalDays,
      usedDays: 0,
      pendingDays: 0,
      balance: totalDays,
    },
    include: {
      leaveType: true,
    },
  });
};

export default {
  // Leave Type
  createLeaveType,
  getAllLeaveTypes,
  getActiveLeaveTypes,
  getLeaveTypeById,
  updateLeaveType,
  deleteLeaveType,
  // Leave Request
  createLeaveRequest,
  getLeaveRequestsWithPagination,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  // Leave Balance
  getEmployeeLeaveBalance,
  initializeLeaveBalance,
};
