import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { departmentService } from "../services";
import sendResponse from "../utils/responseHandler";

const createDepartment = catchAsync(async (req, res) => {
  const { name, description, isActive } = req.body;

  if (!name) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Department name is required");
  }

  const department = await departmentService.createDepartment({
    name,
    description,
    isActive,
  });

  sendResponse(res, httpStatus.CREATED, true, { department }, "Department created successfully");
});

const getDepartments = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = "name",
    sortType = "asc",
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

  const result = await departmentService.getDepartmentsWithPagination(paginationOptions);

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "Departments retrieved successfully",
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

const getAllDepartments = catchAsync(async (req, res) => {
  const departments = await departmentService.getAllDepartments();
  sendResponse(res, httpStatus.OK, true, { departments }, "Departments retrieved successfully");
});

const getActiveDepartments = catchAsync(async (req, res) => {
  const departments = await departmentService.getActiveDepartments();
  sendResponse(res, httpStatus.OK, true, { departments }, "Active departments retrieved successfully");
});

const getDepartment = catchAsync(async (req, res) => {
  const { departmentId } = req.params;
  const department = await departmentService.getDepartmentById(departmentId);
  sendResponse(res, httpStatus.OK, true, { department }, "Department retrieved successfully");
});

const updateDepartment = catchAsync(async (req, res) => {
  const { departmentId } = req.params;
  const updateData = pick(req.body, ["name", "description", "isActive"]);

  const department = await departmentService.updateDepartment(departmentId, updateData);
  sendResponse(res, httpStatus.OK, true, { department }, "Department updated successfully");
});

const deleteDepartment = catchAsync(async (req, res) => {
  const { departmentId } = req.params;
  await departmentService.deleteDepartment(departmentId);
  sendResponse(res, httpStatus.OK, true, null, "Department deleted successfully");
});

export default {
  createDepartment,
  getDepartments,
  getAllDepartments,
  getActiveDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
};
