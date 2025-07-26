import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { employeeService } from "../services";

const createEmployee = catchAsync(async (req, res) => {
  const { email, password, name, role } = req.body;
  const employee = await employeeService.createEmployee(email, password, name, role);
  res.status(httpStatus.CREATED).send(employee);
});

const getEmployees = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", "role"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await employeeService.queryEmployees(filter, options);
  res.send(result);
});

const getEmployee = catchAsync(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.employeeId);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }
  res.send(employee);
});

const updateEmployee = catchAsync(async (req, res) => {
  const employee = await employeeService.updateEmployeeById(req.params.employeeId, req.body);
  res.send(employee);
});

const deleteEmployee = catchAsync(async (req, res) => {
  await employeeService.deleteEmployeeById(req.params.employeeId);
  res.status(httpStatus.NO_CONTENT).send();
});

// Role-specific user creation methods
const createHREmployee = catchAsync(async (req, res) => {
  const { email, password, name, branchId } = req.body;
  const employee = await employeeService.createEmployee(
    email,
    password,
    name,
    "HR",
    branchId
  );
  res.status(httpStatus.CREATED).send(employee);
});

const createEmployeeUser = catchAsync(async (req, res) => {
  const { email, password, name, branchId } = req.body;
  const employee = await employeeService.createEmployee(
    email,
    password,
    name,
    "EMPLOYEE",
    branchId
  );
  res.status(httpStatus.CREATED).send(employee);
});

const getHREmployees = catchAsync(async (req, res) => {
  const filter = { ...pick(req.query, ["name"]), role: "HR" };
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await employeeService.queryEmployees(filter, options);
  res.send(result);
});

const getEmployeesList = catchAsync(async (req, res) => {
  const filter = { ...pick(req.query, ["name"]), role: "EMPLOYEE" };
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await employeeService.queryEmployees(filter, options);
  res.send(result);
});

export default {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  createHREmployee,
  createEmployeeUser,
  getHREmployees,
  getEmployeesList,
};
