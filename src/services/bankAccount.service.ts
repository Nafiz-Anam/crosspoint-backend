import httpStatus from "http-status";
import { BankAccount } from "@prisma/client";
import prisma from "../client";
import ApiError from "../utils/ApiError";

export interface BankAccountCreateData {
  bankName: string;
  bankCountry: string;
  bankIban: string;
  bankSwiftCode?: string;
  accountName?: string;
  isActive?: boolean;
}

export interface BankAccountUpdateData {
  bankName?: string;
  bankCountry?: string;
  bankIban?: string;
  bankSwiftCode?: string;
  accountName?: string;
  isActive?: boolean;
}

const createBankAccount = async (
  data: BankAccountCreateData
): Promise<BankAccount> => {
  // Check if IBAN already exists
  const existingBankAccount = await prisma.bankAccount.findUnique({
    where: { bankIban: data.bankIban },
  });

  if (existingBankAccount) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Bank account with this IBAN already exists"
    );
  }

  return prisma.bankAccount.create({
    data,
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
    ...(filter.bankCountry && {
      bankCountry: {
        contains: filter.bankCountry,
        mode: "insensitive" as const,
      },
    }),
    ...(filter.isActive !== undefined && { isActive: filter.isActive }),
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
    const existingBankAccount = await prisma.bankAccount.findUnique({
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

export default {
  createBankAccount,
  getBankAccounts,
  getBankAccountById,
  updateBankAccountById,
  deleteBankAccountById,
  getActiveBankAccounts,
};
