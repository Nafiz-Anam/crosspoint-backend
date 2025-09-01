import { PrismaClient, Branch } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";

const prisma = new PrismaClient();

// Generate a unique branch ID
const generateBranchId = async (): Promise<string> => {
  const lastBranch = await prisma.branch.findFirst({
    orderBy: { branchId: "desc" },
  });
  if (!lastBranch) {
    return "BR-001";
  }
  const lastNumber = parseInt(lastBranch.branchId.split("-")[1]);
  const nextNumber = lastNumber + 1;
  return `BR-${nextNumber.toString().padStart(3, "0")}`;
};

// Generate a unique employee ID for a specific branch
const generateEmployeeId = async (branchId: string): Promise<string> => {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Branch not found");
  }
  const branchCode = branch.branchId;
  const lastEmployee = await prisma.employee.findFirst({
    where: { employeeId: { startsWith: `EMP-${branchCode}-` } },
    orderBy: { employeeId: "desc" },
  });
  if (!lastEmployee) {
    return `EMP-${branchCode}-001`;
  }
  const lastNumber = parseInt((lastEmployee.employeeId ?? "").split("-")[2]);
  const nextNumber = lastNumber + 1;
  return `EMP-${branchCode}-${nextNumber.toString().padStart(3, "0")}`;
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
  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceId: { startsWith: `INV-${branchCode}-${dateCode}-` } },
    orderBy: { invoiceId: "desc" },
  });
  if (!lastInvoice) {
    return `INV-${branchCode}-${dateCode}-001`;
  }
  const lastNumber = parseInt(lastInvoice.invoiceId!.split("-")[3]);
  const nextNumber = lastNumber + 1;
  return `INV-${branchCode}-${dateCode}-${nextNumber
    .toString()
    .padStart(3, "0")}`;
};

// Generate a unique service ID
const generateServiceId = async (): Promise<string> => {
  const lastService = await prisma.service.findFirst({
    orderBy: { id: "desc" },
  });
  if (!lastService) {
    return "SRV-001";
  }
  const lastNumber = parseInt(lastService.id.split("-")[1]);
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
    where: { isActive: true },
    orderBy: { branchId: "asc" },
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
    where: { isActive: true },
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
  getBranchById,
  getBranchByBranchId,
  updateBranch,
  deleteBranch,
  getBranchStatistics,
  getAllBranchesWithStatistics,
  generateServiceId,
};
