import { Role } from "@prisma/client";
import Joi from "joi";
import { password } from "./custom.validation";

const createEmployee = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid(Role.ADMIN, Role.HR, Role.EMPLOYEE),
  }),
};

const getEmployees = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.number().integer(),
  }),
};

const updateEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.number().integer(),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

const deleteEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.number().integer(),
  }),
};

const createHREmployee = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    branchId: Joi.string().required(),
  }),
};

const createEmployeeEmployee = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    branchId: Joi.string().required(),
  }),
};

export default {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  createHREmployee,
  createEmployeeEmployee,
};
