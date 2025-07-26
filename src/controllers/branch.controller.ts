import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { branchService } from "../services";

const createBranch = catchAsync(async (req, res) => {
  const { name, address, city, postalCode, province, phone, email } = req.body;
  if (!name || !address || !city || !postalCode || !province) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Name, address, city, postal code, and province are required"
    );
  }
  const postalCodeRegex = /^\d{5}$/;
  if (!postalCodeRegex.test(postalCode)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Postal code must be 5 digits (Italian CAP format)"
    );
  }
  const provinceRegex = /^[A-Z]{2}$/;
  if (!provinceRegex.test(province.toUpperCase())) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Province must be 2 letters (Italian province code)"
    );
  }
  const branch = await branchService.createBranch({
    name,
    address,
    city,
    postalCode,
    province: province.toUpperCase(),
    phone,
    email,
  });
  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Branch created successfully",
    data: branch,
  });
});

const getAllBranches = catchAsync(async (req, res) => {
    const branches = await branchService.getAllBranches();
  res.status(httpStatus.OK).json({
      success: true,
      message: "Branches retrieved successfully",
      data: branches,
    });
});

const getBranchById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const branch = await branchService.getBranchById(id);
  res.status(httpStatus.OK).json({
    success: true,
    message: "Branch retrieved successfully",
    data: branch,
  });
});

const getBranchByBranchId = catchAsync(async (req, res) => {
    const { branchId } = req.params;
    const branch = await branchService.getBranchByBranchId(branchId);
  res.status(httpStatus.OK).json({
      success: true,
      message: "Branch retrieved successfully",
      data: branch,
    });
});

const updateBranch = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  if (updateData.postalCode) {
    const postalCodeRegex = /^\d{5}$/;
    if (!postalCodeRegex.test(updateData.postalCode)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Postal code must be 5 digits (Italian CAP format)"
      );
    }
  }
  if (updateData.province) {
    const provinceRegex = /^[A-Z]{2}$/;
    if (!provinceRegex.test(updateData.province.toUpperCase())) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Province must be 2 letters (Italian province code)"
      );
    }
    updateData.province = updateData.province.toUpperCase();
  }
  const branch = await branchService.updateBranch(id, updateData);
  res.status(httpStatus.OK).json({
    success: true,
    message: "Branch updated successfully",
    data: branch,
  });
});

const deleteBranch = catchAsync(async (req, res) => {
  const { id } = req.params;
  await branchService.deleteBranch(id);
  res.status(httpStatus.OK).json({
    success: true,
    message: "Branch deleted successfully",
  });
});

const getBranchStatistics = catchAsync(async (req, res) => {
    const { id } = req.params;
    const statistics = await branchService.getBranchStatistics(id);
  res.status(httpStatus.OK).json({
      success: true,
      message: "Branch statistics retrieved successfully",
      data: statistics,
    });
});

const getAllBranchesWithStatistics = catchAsync(async (req, res) => {
  const branchesWithStats = await branchService.getAllBranchesWithStatistics();
  res.status(httpStatus.OK).json({
      success: true,
      message: "Branches with statistics retrieved successfully",
      data: branchesWithStats,
    });
});

const generateEmployeeId = catchAsync(async (req, res) => {
    const { branchId } = req.params;
    const employeeId = await branchService.generateEmployeeId(branchId);
  res.status(httpStatus.OK).json({
      success: true,
      message: "Employee ID generated successfully",
      data: { employeeId },
    });
});

const generateCustomerId = catchAsync(async (req, res) => {
    const { branchId } = req.params;
    const customerId = await branchService.generateCustomerId(branchId);
  res.status(httpStatus.OK).json({
      success: true,
      message: "Customer ID generated successfully",
      data: { customerId },
    });
});

const generateInvoiceId = catchAsync(async (req, res) => {
    const { branchId } = req.params;
    const { year, month, date } = req.query;
    const invoiceId = await branchService.generateInvoiceId(
      branchId,
      year ? parseInt(year as string) : undefined,
      month ? parseInt(month as string) : undefined,
      date ? parseInt(date as string) : undefined
    );
  res.status(httpStatus.OK).json({
      success: true,
      message: "Invoice ID generated successfully",
      data: { invoiceId },
    });
});

export default {
  createBranch,
  getAllBranches,
  getBranchById,
  getBranchByBranchId,
  updateBranch,
  deleteBranch,
  getBranchStatistics,
  getAllBranchesWithStatistics,
  generateEmployeeId,
  generateCustomerId,
  generateInvoiceId,
};
