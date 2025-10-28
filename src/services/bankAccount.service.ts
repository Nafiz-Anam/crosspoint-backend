import httpStatus from "http-status";
import { BankAccount } from "@prisma/client";
import prisma from "../client";
import ApiError from "../utils/ApiError";

export interface BankAccountCreateData {
  bankName: string;
  bankCountry?: string;
  accountNumber: string;
  bankIban?: string;
  bankSwiftCode?: string;
  accountName: string;
  isActive?: boolean;
}

export interface BankAccountUpdateData {
  bankName?: string;
  bankCountry?: string;
  accountNumber?: string;
  bankIban?: string;
  bankSwiftCode?: string;
  accountName?: string;
  isActive?: boolean;
}

const createBankAccount = async (
  data: BankAccountCreateData
): Promise<BankAccount> => {
  // Check if IBAN already exists (only if provided)
  if (data.bankIban) {
    const existingIban = await prisma.bankAccount.findFirst({
      where: { bankIban: data.bankIban },
    });

    if (existingIban) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Bank account with this IBAN already exists"
      );
    }
  }

  // Prepare data with defaults for optional fields
  const bankAccountData = {
    bankName: data.bankName,
    bankCountry: data.bankCountry || "Unknown",
    accountNumber: data.accountNumber,
    bankIban: data.bankIban || null,
    bankSwiftCode: data.bankSwiftCode || null,
    accountName: data.accountName,
    isActive: data.isActive !== undefined ? data.isActive : true,
  };

  return prisma.bankAccount.create({
    data: bankAccountData,
  });
};

const getBankAccounts = async (
  filter: any,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  }
) => {
  const { sortBy, sortType, limit, page } = options;
  const pageNum = page ?? 1;
  const limitNum = limit ?? 10;
  const skip = (pageNum - 1) * limitNum;

  const where = {
    ...(filter.bankName && {
      bankName: {
        contains: filter.bankName,
        mode: "insensitive" as const,
      },
    }),
    ...(filter.bankIban && {
      bankIban: {
        contains: filter.bankIban,
        mode: "insensitive" as const,
      },
    }),
    ...(filter.accountName && {
      accountName: {
        contains: filter.accountName,
        mode: "insensitive" as const,
      },
    }),
    ...(filter.isActive !== undefined && {
      isActive: filter.isActive === "true" || filter.isActive === true,
    }),
  };

  const [bankAccounts, total] = await Promise.all([
    prisma.bankAccount.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: sortBy ? { [sortBy]: sortType || "asc" } : { createdAt: "desc" },
    }),
    prisma.bankAccount.count({ where }),
  ]);

  return {
    bankAccounts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limitNum),
  };
};

const getBankAccountById = async (id: string): Promise<BankAccount | null> => {
  return prisma.bankAccount.findUnique({
    where: { id },
  });
};

const updateBankAccountById = async (
  id: string,
  updateData: BankAccountUpdateData
): Promise<BankAccount> => {
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id },
  });

  if (!bankAccount) {
    throw new ApiError(httpStatus.NOT_FOUND, "Bank account not found");
  }

  // Check if IBAN is being updated and if it already exists
  if (updateData.bankIban && updateData.bankIban !== bankAccount.bankIban) {
    const existingBankAccount = await prisma.bankAccount.findFirst({
      where: { bankIban: updateData.bankIban },
    });

    if (existingBankAccount) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Bank account with this IBAN already exists"
      );
    }
  }

  return prisma.bankAccount.update({
    where: { id },
    data: updateData,
  });
};

const deleteBankAccountById = async (id: string): Promise<void> => {
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id },
    include: {
      invoices: true,
    },
  });

  if (!bankAccount) {
    throw new ApiError(httpStatus.NOT_FOUND, "Bank account not found");
  }

  // Check if bank account is being used by any invoices
  if (bankAccount.invoices.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete bank account that is being used by invoices"
    );
  }

  await prisma.bankAccount.delete({
    where: { id },
  });
};

const getActiveBankAccounts = async (): Promise<BankAccount[]> => {
  return prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: { bankName: "asc" },
  });
};

// Get all bank accounts with pagination
const getBankAccountsWithPagination = async (options: {
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
      { bankName: { contains: search, mode: "insensitive" as const } },
      { accountName: { contains: search, mode: "insensitive" as const } },
      { accountNumber: { contains: search, mode: "insensitive" as const } },
      { bankIban: { contains: search, mode: "insensitive" as const } },
      { bankSwiftCode: { contains: search, mode: "insensitive" as const } },
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
  const total = await prisma.bankAccount.count({ where: whereClause });

  // Get paginated data
  const bankAccounts = await prisma.bankAccount.findMany({
    where: whereClause,
    orderBy: orderByClause,
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: bankAccounts,
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

export default {
  createBankAccount,
  getBankAccounts,
  getBankAccountsWithPagination,
  getBankAccountById,
  updateBankAccountById,
  deleteBankAccountById,
  getActiveBankAccounts,
};
