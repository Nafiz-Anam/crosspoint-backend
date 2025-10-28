import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { bankAccountService } from "../services";
import sendResponse from "../utils/responseHandler";

const createBankAccount = catchAsync(async (req, res) => {
  const {
    bankName,
    accountNumber,
    accountName,
    bankIban,
    bankSwiftCode,
    isActive,
  } = req.body;

  // Validate required fields
  if (!bankName || !accountName || !accountNumber) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Missing required fields: bankName, accountName and accountNumber"
    );
  }

  const bankAccount = await bankAccountService.createBankAccount({
    bankName,
    accountNumber,
    bankIban: bankIban || undefined,
    bankSwiftCode,
    accountName,
    isActive: isActive !== undefined ? isActive : true,
  });

  sendResponse(
    res,
    httpStatus.CREATED,
    true,
    { bankAccount },
    "Bank account created successfully"
  );
});

const getBankAccounts = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = "createdAt",
    sortType = "desc",
    isActive,
  } = req.query;

  const paginationOptions = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    search: search as string,
    sortBy: sortBy as string,
    sortType: sortType as "asc" | "desc",
    isActive: isActive as string,
  };

  const result = await bankAccountService.getBankAccountsWithPagination(
    paginationOptions
  );

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "Bank accounts retrieved successfully",
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
    },
  });
});

const getBankAccount = catchAsync(async (req, res) => {
  const { bankAccountId } = req.params;

  if (!bankAccountId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Bank account ID is required");
  }

  const bankAccount = await bankAccountService.getBankAccountById(
    bankAccountId
  );
  if (!bankAccount) {
    throw new ApiError(httpStatus.NOT_FOUND, "Bank account not found");
  }

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { bankAccount },
    "Bank account retrieved successfully"
  );
});

const updateBankAccount = catchAsync(async (req, res) => {
  const { bankAccountId } = req.params;
  const updateData = req.body;

  if (!bankAccountId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Bank account ID is required");
  }

  const bankAccount = await bankAccountService.updateBankAccountById(
    bankAccountId,
    updateData
  );

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { bankAccount },
    "Bank account updated successfully"
  );
});

const deleteBankAccount = catchAsync(async (req, res) => {
  const { bankAccountId } = req.params;

  if (!bankAccountId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Bank account ID is required");
  }

  await bankAccountService.deleteBankAccountById(bankAccountId);

  sendResponse(
    res,
    httpStatus.OK,
    true,
    null,
    "Bank account deleted successfully"
  );
});

const getActiveBankAccounts = catchAsync(async (req, res) => {
  const bankAccounts = await bankAccountService.getActiveBankAccounts();

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { bankAccounts },
    "Active bank accounts retrieved successfully"
  );
});

export default {
  createBankAccount,
  getBankAccounts,
  getBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getActiveBankAccounts,
};
