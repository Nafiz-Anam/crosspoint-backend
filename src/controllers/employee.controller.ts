import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { employeeService } from "../services";

const createEmployee = catchAsync(async (req, res) => {
  const { email, password, name, role, branchId, isActive, permissions } =
    req.body;

  const employee = await employeeService.createEmployee({
    email,
    password,
    name,
    role,
    branchId,
    isActive,
    permissions,
  });

  res.status(httpStatus.CREATED).send(employee);
});

const getEmployees = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", "role"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);

  // Convert string values to appropriate types for options
  const processedOptions = {
    ...options,
    limit: options.limit ? parseInt(options.limit as string, 10) : undefined,
    page: options.page ? parseInt(options.page as string, 10) : undefined,
  };

  const result = await employeeService.queryEmployees(filter, processedOptions);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Employee retrieved successfully",
    data: result,
  });
});

const getEmployee = catchAsync(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }
  res.send(employee);
});

const updateEmployee = catchAsync(async (req, res) => {
  const employee = await employeeService.updateEmployeeById(
    req.params.employeeId,
    req.body
  );
  res.send(employee);
});

const deleteEmployee = catchAsync(async (req, res) => {
  await employeeService.deleteEmployeeById(req.params.employeeId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getHREmployees = catchAsync(async (req, res) => {
  const filter = { ...pick(req.query, ["name"]), role: "HR" };
  const options = pick(req.query, ["sortBy", "limit", "page"]);

  // Convert string values to appropriate types for options
  const processedOptions = {
    ...options,
    limit: options.limit ? parseInt(options.limit as string, 10) : undefined,
    page: options.page ? parseInt(options.page as string, 10) : undefined,
  };

  const result = await employeeService.queryEmployees(filter, processedOptions);
  res.send(result);
});

const getEmployeesList = catchAsync(async (req, res) => {
  const filter = { ...pick(req.query, ["name"]), role: "EMPLOYEE" };
  const options = pick(req.query, ["sortBy", "limit", "page"]);

  // Convert string values to appropriate types for options
  const processedOptions = {
    ...options,
    limit: options.limit ? parseInt(options.limit as string, 10) : undefined,
    page: options.page ? parseInt(options.page as string, 10) : undefined,
  };

  const result = await employeeService.queryEmployees(filter, processedOptions);
  res.send(result);
});

export default {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getHREmployees,
  getEmployeesList,
};
