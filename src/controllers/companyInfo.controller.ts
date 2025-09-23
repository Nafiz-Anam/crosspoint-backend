import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { companyInfoService } from "../services";

const getCompanyInfo = catchAsync(async (req, res) => {
  const companyInfo = await companyInfoService.getCompanyInfo();
  res.status(httpStatus.OK).json({
    success: true,
    message: "Company information retrieved successfully",
    data: companyInfo,
  });
});

const updateCompanyInfo = catchAsync(async (req, res) => {
  const companyInfo = await companyInfoService.updateCompanyInfo(req.body);
  res.status(httpStatus.OK).json({
    success: true,
    message: "Company information updated successfully",
    data: companyInfo,
  });
});

const uploadLogo = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No logo file provided");
  }

  const logoUrl = await companyInfoService.uploadLogo(req.file);
  res.status(httpStatus.OK).json({
    success: true,
    message: "Logo uploaded successfully",
    data: { logoUrl },
  });
});

export default {
  getCompanyInfo,
  updateCompanyInfo,
  uploadLogo,
};
