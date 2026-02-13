import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { designationService } from "../services";
import sendResponse from "../utils/responseHandler";

const createDesignation = catchAsync(async (req, res) => {
  const { name, departmentId, description, isActive } = req.body;

  if (!name || !departmentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Designation name and department are required");
  }

  const designation = await designationService.createDesignation({
    name,
    departmentId,
    description,
    isActive,
  });

  sendResponse(res, httpStatus.CREATED, true, { designation }, "Designation created successfully");
});

const getDesignations = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = "name",
    sortType = "asc",
    departmentId,
    isActive,
  } = req.query;

  const paginationOptions = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    search: search as string,
    sortBy: sortBy as string,
    sortType: sortType as "asc" | "desc",
    departmentId: departmentId as string,
    isActive: isActive as string,
  };

  const result = await designationService.getDesignationsWithPagination(paginationOptions);

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "Designations retrieved successfully",
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

const getAllDesignations = catchAsync(async (req, res) => {
  const { departmentId } = req.query;
  const designations = await designationService.getAllDesignations();
  sendResponse(res, httpStatus.OK, true, { designations }, "Designations retrieved successfully");
});

const getActiveDesignations = catchAsync(async (req, res) => {
  const { departmentId } = req.query;
  const designations = await designationService.getActiveDesignations(departmentId as string | undefined);
  sendResponse(res, httpStatus.OK, true, { designations }, "Active designations retrieved successfully");
});

const getDesignation = catchAsync(async (req, res) => {
  const { designationId } = req.params;
  const designation = await designationService.getDesignationById(designationId);
  sendResponse(res, httpStatus.OK, true, { designation }, "Designation retrieved successfully");
});

const updateDesignation = catchAsync(async (req, res) => {
  const { designationId } = req.params;
  const updateData = pick(req.body, ["name", "departmentId", "description", "isActive"]);

  const designation = await designationService.updateDesignation(designationId, updateData);
  sendResponse(res, httpStatus.OK, true, { designation }, "Designation updated successfully");
});

const deleteDesignation = catchAsync(async (req, res) => {
  const { designationId } = req.params;
  await designationService.deleteDesignation(designationId);
  sendResponse(res, httpStatus.OK, true, null, "Designation deleted successfully");
});

export default {
  createDesignation,
  getDesignations,
  getAllDesignations,
  getActiveDesignations,
  getDesignation,
  updateDesignation,
  deleteDesignation,
};
