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
  const filter = pick(req.query, ["name", "category"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);

  // Convert string values to appropriate types for options
  const processedOptions = {
    ...options,
    limit: options.limit ? parseInt(options.limit as string, 10) : undefined,
    page: options.page ? parseInt(options.page as string, 10) : undefined,
  };

  const result = await serviceService.queryServices(filter, processedOptions);

  sendResponse(
    res,
    httpStatus.OK,
    true,
    result,
    "Services retrieved successfully"
  );
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

export default {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
};
