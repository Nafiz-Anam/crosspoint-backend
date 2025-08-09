import { Role } from "@prisma/client";
import Joi from "joi";
import { password } from "./custom.validation";

const createEmployee = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string()
      .required()
      .valid(Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE),
    branchId: Joi.string().when("role", {
      is: Joi.not(Role.ADMIN),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    isActive: Joi.boolean().default(true),
    permissions: Joi.array().items(Joi.string()).min(1).required(),
  }),
};

const getEmployees = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string().valid(Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.string().required(),
  }),
};

const updateEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
      role: Joi.string().valid(
        Role.ADMIN,
        Role.HR,
        Role.MANAGER,
        Role.EMPLOYEE
      ),
      branchId: Joi.string(),
      isActive: Joi.boolean(),
      permissions: Joi.array().items(Joi.string()),
    })
    .min(1),
};

const deleteEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.string().required(),
  }),
};

export default {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
};
