import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { serviceService } from "../services";
import sendResponse from "../utils/responseHandler";

const createService = catchAsync(async (req, res) => {
  const { name, price, category } = req.body;
  const service = await serviceService.createService(name, price, category);

  sendResponse(
    res,
    httpStatus.CREATED,
    true,
    { service },
    "Service created successfully"
  );
});

const getServices = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = "createdAt",
    sortType = "desc",
    category,
  } = req.query;

  const paginationOptions = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    search: search as string,
    sortBy: sortBy as string,
    sortType: sortType as "asc" | "desc",
    category: category as string,
  };

  const result = await serviceService.getServicesWithPagination(
    paginationOptions
  );

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "Services retrieved successfully",
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

const getService = catchAsync(async (req, res) => {
  const service = await serviceService.getServiceById(req.params.serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { service },
    "Service retrieved successfully"
  );
});

const updateService = catchAsync(async (req, res) => {
  const service = await serviceService.updateServiceById(
    req.params.serviceId,
    req.body
  );

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { service },
    "Service updated successfully"
  );
});

const deleteService = catchAsync(async (req, res) => {
  await serviceService.deleteServiceById(req.params.serviceId);

  sendResponse(res, httpStatus.OK, true, null, "Service deleted successfully");
});

const getAllServices = catchAsync(async (req, res) => {
  const { search, sortBy = "name", sortType = "asc", category } = req.query;

  const options = {
    search: search as string,
    sortBy: sortBy as string,
    sortType: sortType as "asc" | "desc",
    category: category as string,
  };

  const services = await serviceService.getAllServicesForDropdown(options);

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "All services retrieved successfully",
    data: services,
    total: services.length,
  });
});

export default {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getAllServices,
};
