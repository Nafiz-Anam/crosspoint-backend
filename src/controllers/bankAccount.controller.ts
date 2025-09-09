import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { bankAccountService } from "../services";
import sendResponse from "../utils/responseHandler";

const createBankAccount = catchAsync(async (req, res) => {
  const {
    bankName,
    bankCountry,
    bankIban,
    bankSwiftCode,
    accountName,
    isActive,
  } = req.body;

  // Validate required fields
  if (!bankName || !bankCountry || !bankIban) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Missing required fields: bankName, bankCountry, and bankIban"
    );
  }

  const bankAccount = await bankAccountService.createBankAccount({
    bankName,
    bankCountry,
    bankIban,
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
  const filter = pick(req.query, ["bankName", "bankCountry", "isActive"]);
  const options = pick(req.query, ["sortBy", "sortType", "limit", "page"]);

  // Convert string values to appropriate types for options
  const processedOptions = {
    ...options,
    limit: options.limit ? parseInt(options.limit as string, 10) : undefined,
    page: options.page ? parseInt(options.page as string, 10) : undefined,
  };

  const result = await bankAccountService.getBankAccounts(
    filter,
    processedOptions
  );

  sendResponse(
    res,
    httpStatus.OK,
    true,
    result,
    "Bank accounts retrieved successfully"
  );
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
