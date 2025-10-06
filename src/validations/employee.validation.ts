import { Role } from "@prisma/client";
import Joi from "joi";
import { password } from "./custom.validation";

const createEmployee = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    nationalIdentificationNumber: Joi.string()
      .optional()
      .allow(null, "")
      .min(5)
      .max(20),
    role: Joi.string()
      .required()
      .valid(Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE),
    branchId: Joi.string().when("role", {
      is: Joi.not(Role.ADMIN),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    dateOfBirth: Joi.date().required(),
    isActive: Joi.boolean().default(true),
  }),
};

const getEmployees = {
  query: Joi.object().keys({
    name: Joi.string(),
    nationalIdentificationNumber: Joi.string(),
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
      nationalIdentificationNumber: Joi.string().allow(null, "").min(5).max(20),
      role: Joi.string().valid(
        Role.ADMIN,
        Role.HR,
        Role.MANAGER,
        Role.EMPLOYEE
      ),
      branchId: Joi.string(),
      isActive: Joi.boolean(),
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
