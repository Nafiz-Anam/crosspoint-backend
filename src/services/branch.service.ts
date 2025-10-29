import { PrismaClient, Branch } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";

const prisma = new PrismaClient();

// Generate a unique branch ID
// Handles race conditions by checking if branchId exists and retrying if needed
const generateBranchId = async (): Promise<string> => {
  const maxRetries = 10; // Prevent infinite loops

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Get the maximum branch ID to find the highest existing number
    const branches = await prisma.branch.findMany({
      where: {
        branchId: {
          startsWith: "BR-",
        },
      },
      select: {
        branchId: true,
      },
      orderBy: {
        branchId: "desc",
      },
      take: 1, // Get only the highest one
    });

    let nextSequence = 1; // Default to 1 if no branches exist

    if (branches.length > 0 && branches[0].branchId) {
      // Extract sequence number from the highest branchId
      // Format: BR-001
      const lastBranchId = branches[0].branchId;
      const sequencePart = lastBranchId.split("-").pop(); // Get "001"
      if (sequencePart) {
        const lastSequence = parseInt(sequencePart, 10);
        nextSequence = lastSequence + 1;
      }
    }

    // Generate new branchId with next sequence
    const sequence = String(nextSequence).padStart(3, "0");
    const branchId = `BR-${sequence}`;

    // Check if this branchId already exists (handles race conditions)
    const existingBranch = await prisma.branch.findUnique({
      where: { branchId },
      select: { id: true },
    });

    if (!existingBranch) {
      // BranchId is available
      return branchId;
    }

    // If branchId exists (race condition), increment and try again
    // On next iteration, it will find the new highest number
  }

  // If we've exhausted retries, use timestamp-based approach as fallback
  const timestamp = Date.now().toString().slice(-6);
  return `BR-${timestamp}`;
};

// Generate a unique employee ID for a specific branch
// Handles race conditions by checking if employeeId exists and retrying if needed
const generateEmployeeId = async (branchId: string): Promise<string> => {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Branch not found");
  }
  const branchCode = branch.branchId;
  const maxRetries = 10; // Prevent infinite loops
  const employeeIdPrefix = `EMP-${branchCode}-`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Get the maximum employee ID for this branch
    // This finds the highest existing number, so we can increment from there
    const employees = await prisma.employee.findMany({
      where: {
        branchId: branchId,
        employeeId: {
          startsWith: employeeIdPrefix,
        },
      },
      select: {
        employeeId: true,
      },
      orderBy: {
        employeeId: "desc",
      },
      take: 1, // Get only the highest one
    });

    let nextSequence = 1; // Default to 1 if no employees exist

    if (employees.length > 0 && employees[0].employeeId) {
      // Extract sequence number from the highest employeeId
      // Format: EMP-BR-004-001
      const lastEmployeeId = employees[0].employeeId;
      const sequencePart = lastEmployeeId.split("-").pop(); // Get "001"
      if (sequencePart) {
        const lastSequence = parseInt(sequencePart, 10);
        nextSequence = lastSequence + 1;
      }
    }

    // Generate new employeeId with next sequence
    const sequence = String(nextSequence).padStart(3, "0");
    const employeeId = `${employeeIdPrefix}${sequence}`;

    // Check if this employeeId already exists (handles race conditions)
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId },
      select: { id: true },
    });

    if (!existingEmployee) {
      // EmployeeId is available
      return employeeId;
    }

    // If employeeId exists (race condition), increment and try again
    // On next iteration, it will find the new highest number
  }

  // If we've exhausted retries, use timestamp-based approach as fallback
  const timestamp = Date.now().toString().slice(-6);
  return `${employeeIdPrefix}${timestamp}`;
};

// Generate a unique customer ID for a specific branch
const generateCustomerId = async (branchId: string): Promise<string> => {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Branch not found");
  }
  const branchCode = branch.branchId;
  const lastCustomer = await prisma.client.findFirst({
    where: { clientId: { startsWith: `CLT-${branchCode}-` } },
    orderBy: { clientId: "desc" },
  });
  if (!lastCustomer) {
    return `CUST-${branchCode}-001`;
  }
  const lastNumber = parseInt(lastCustomer.clientId!.split("-")[2]);
  const nextNumber = lastNumber + 1;
  return `CUST-${branchCode}-${nextNumber.toString().padStart(3, "0")}`;
};

// Generate a unique invoice ID for a specific branch, year, month, and date
// Handles race conditions by checking if invoiceId exists and retrying if needed
const generateInvoiceId = async (
  branchId: string,
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1,
  date: number = new Date().getDate()
): Promise<string> => {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Branch not found");
  }
  const branchCode = branch.branchId;
  const monthStr = month.toString().padStart(2, "0");
  const dateStr = date.toString().padStart(2, "0");
  const dateCode = `${year}${monthStr}${dateStr}`;
  const maxRetries = 10; // Prevent infinite loops
  const invoiceIdPrefix = `INV-${branchCode}-${dateCode}-`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Get the maximum invoice ID for this branch and date
    // This finds the highest existing number, so we can increment from there
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceId: {
          startsWith: invoiceIdPrefix,
        },
      },
      select: {
        invoiceId: true,
      },
      orderBy: {
        invoiceId: "desc",
      },
      take: 1, // Get only the highest one
    });

    let nextSequence = 1; // Default to 1 if no invoices exist

    if (invoices.length > 0 && invoices[0].invoiceId) {
      // Extract sequence number from the highest invoiceId
      // Format: INV-BR-004-20251029-001
      const lastInvoiceId = invoices[0].invoiceId;
      const sequencePart = lastInvoiceId.split("-").pop(); // Get "001"
      if (sequencePart) {
        const lastSequence = parseInt(sequencePart, 10);
        nextSequence = lastSequence + 1;
      }
    }

    // Generate new invoiceId with next sequence
    const sequence = String(nextSequence).padStart(3, "0");
    const invoiceId = `${invoiceIdPrefix}${sequence}`;

    // Check if this invoiceId already exists (handles race conditions)
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceId },
      select: { id: true },
    });

    if (!existingInvoice) {
      // InvoiceId is available
      return invoiceId;
    }

    // If invoiceId exists (race condition), increment and try again
    // On next iteration, it will find the new highest number
  }

  // If we've exhausted retries, use timestamp-based approach as fallback
  const timestamp = Date.now().toString().slice(-6);
  return `${invoiceIdPrefix}${timestamp}`;
};

// Generate a unique service ID
const generateServiceId = async (): Promise<string> => {
  const lastService = await prisma.service.findFirst({
    orderBy: { serviceId: "desc" },
  });
  if (!lastService) {
    return "SRV-001";
  }
  const lastNumber = parseInt(lastService.serviceId.split("-")[1]);
  const nextNumber = lastNumber + 1;
  return `SRV-${nextNumber.toString().padStart(3, "0")}`;
};

// Create a new branch
const createBranch = async (branchData: {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  phone?: string;
  email?: string;
}): Promise<Branch> => {
  const branchId = await generateBranchId();
  const branch = await prisma.branch.create({
    data: { ...branchData, branchId },
  });
  return branch;
};

// Get all branches
const getAllBranches = async (): Promise<Branch[]> => {
  return prisma.branch.findMany({
    orderBy: { createdAt: "desc" },
  });
};

// Get all branches with pagination
const getAllBranchesWithPagination = async (options: {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortType: "asc" | "desc";
  isActive?: string;
}) => {
  const { page, limit, search, sortBy, sortType, isActive } = options;
  const skip = (page - 1) * limit;

  // Build where clause for search and filters
  let whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { city: { contains: search, mode: "insensitive" as const } },
      { province: { contains: search, mode: "insensitive" as const } },
      { branchId: { contains: search, mode: "insensitive" as const } },
    ];
  }

  // Apply isActive filtering
  if (isActive !== undefined && isActive !== "") {
    whereClause.isActive = isActive === "true";
  }

  // Build orderBy clause
  const orderByClause = {
    [sortBy]: sortType,
  };

  // Get total count for pagination
  const total = await prisma.branch.count({ where: whereClause });

  // Get paginated data
  const branches = await prisma.branch.findMany({
    where: whereClause,
    orderBy: orderByClause,
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: branches,
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

// Get active branches only (for dropdowns and selections)
const getActiveBranches = async (): Promise<Branch[]> => {
  return prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
};

// Get branch by ID
const getBranchById = async (id: string): Promise<Branch> => {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Branch not found");
  }
  return branch;
};

// Get branch by branch ID
const getBranchByBranchId = async (branchId: string): Promise<Branch> => {
  const branch = await prisma.branch.findUnique({ where: { branchId } });
  if (!branch) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Branch not found");
  }
  return branch;
};

// Update branch
const updateBranch = async (
  id: string,
  updateData: Partial<{
    name: string;
    address: string;
    city: string;
    postalCode: string;
    province: string;
    phone: string;
    email: string;
    isActive: boolean;
  }>
): Promise<Branch> => {
  const branch = await prisma.branch.update({
    where: { id },
    data: updateData,
  });
  return branch;
};

// Delete branch
const deleteBranch = async (id: string): Promise<void> => {
  await prisma.branch.delete({ where: { id } });
};

// Get branch statistics
const getBranchStatistics = async (branchId: string) => {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      _count: {
        select: {
          employees: true,
          clients: true,
          invoices: true,
        },
      },
      invoices: {
        select: {
          totalAmount: true,
          status: true,
        },
      },
    },
  });

  if (!branch) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Branch not found");
  }

  const totalRevenue = branch.invoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  const pendingInvoices = branch.invoices.filter(
    (invoice) => invoice.status === "UNPAID"
  );
  const overdueInvoices = branch.invoices.filter(
    (invoice) => invoice.status === "OVERDUE"
  );

  return {
    branch: {
      id: branch.id,
      branchId: branch.branchId,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      postalCode: branch.postalCode,
      province: branch.province,
      phone: branch.phone,
      email: branch.email,
      isActive: branch.isActive,
    },
    statistics: {
      totalEmployees: branch._count.employees,
      totalClients: branch._count.clients,
      totalInvoices: branch._count.invoices,
      totalRevenue,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
    },
  };
};

// Get all branches with statistics
const getAllBranchesWithStatistics = async () => {
  const branches = await prisma.branch.findMany({
    include: {
      _count: {
        select: {
          employees: true,
          clients: true,
          invoices: true,
        },
      },
      invoices: {
        select: {
          totalAmount: true,
          status: true,
        },
      },
    },
    orderBy: { branchId: "asc" },
  });

  return branches.map((branch) => {
    const totalRevenue = branch.invoices
      .filter((invoice) => invoice.status === "PAID")
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    const pendingInvoices = branch.invoices.filter(
      (invoice) => invoice.status === "UNPAID"
    );
    const overdueInvoices = branch.invoices.filter(
      (invoice) => invoice.status === "OVERDUE"
    );

    return {
      branch: {
        id: branch.id,
        branchId: branch.branchId,
        name: branch.name,
        address: branch.address,
        city: branch.city,
        postalCode: branch.postalCode,
        province: branch.province,
        phone: branch.phone,
        email: branch.email,
        isActive: branch.isActive,
      },
      statistics: {
        totalEmployees: branch._count.employees,
        totalClients: branch._count.clients,
        totalInvoices: branch._count.invoices,
        totalRevenue,
        pendingInvoices: pendingInvoices.length,
        overdueInvoices: overdueInvoices.length,
      },
    };
  });
};

export default {
  generateBranchId,
  generateEmployeeId,
  generateCustomerId,
  generateInvoiceId,
  createBranch,
  getAllBranches,
  getAllBranchesWithPagination,
  getActiveBranches,
  getBranchById,
  getBranchByBranchId,
  updateBranch,
  deleteBranch,
  getBranchStatistics,
  getAllBranchesWithStatistics,
  generateServiceId,
};
