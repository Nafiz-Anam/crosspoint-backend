import { Role } from "@prisma/client";
import Joi from "joi";
import { password } from "./custom.validation";

const createEmployee = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    phone: Joi.string().required().min(7).max(20),
    nationalIdentificationNumber: Joi.string().required().min(5).max(20),
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
    search: Joi.string().optional(),
    name: Joi.string(),
    nationalIdentificationNumber: Joi.string(),
    role: Joi.string().valid(Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE),
    isActive: Joi.boolean(),
    branchId: Joi.string().optional(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid("asc", "desc").optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    page: Joi.number().integer().min(1).optional(),
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
      phone: Joi.string().min(7).max(20),
      nationalIdentificationNumber: Joi.string().required().min(5).max(20),
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
