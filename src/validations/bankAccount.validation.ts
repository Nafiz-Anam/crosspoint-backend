import Joi from "joi";
import { objectId } from "./custom.validation";

export const bankAccountValidation = {
  createBankAccount: {
    body: Joi.object().keys({
      bankName: Joi.string().required().max(100).messages({
        "string.empty": "Bank name is required",
        "string.max": "Bank name cannot exceed 100 characters",
        "any.required": "Bank name is required",
      }),
      bankCountry: Joi.string().required().max(100).messages({
        "string.empty": "Bank country is required",
        "string.max": "Bank country cannot exceed 100 characters",
        "any.required": "Bank country is required",
      }),
      bankIban: Joi.string().required().min(15).max(34).messages({
        "string.empty": "Bank IBAN is required",
        "string.min": "Bank IBAN must be at least 15 characters",
        "string.max": "Bank IBAN cannot exceed 34 characters",
        "any.required": "Bank IBAN is required",
      }),
      bankSwiftCode: Joi.string().optional().max(11).messages({
        "string.max": "Bank SWIFT code cannot exceed 11 characters",
      }),
      accountName: Joi.string().optional().max(100).messages({
        "string.max": "Account name cannot exceed 100 characters",
      }),
      isActive: Joi.boolean().optional().messages({
        "boolean.base": "isActive must be a boolean",
      }),
    }),
  },

  getBankAccounts: {
    query: Joi.object().keys({
      bankName: Joi.string().optional().messages({
        "string.base": "Bank name must be a string",
      }),
      bankCountry: Joi.string().optional().messages({
        "string.base": "Bank country must be a string",
      }),
      isActive: Joi.boolean().optional().messages({
        "boolean.base": "isActive must be a boolean",
      }),
      sortBy: Joi.string().optional().messages({
        "string.base": "sortBy must be a string",
      }),
      sortType: Joi.string().valid("asc", "desc").optional().messages({
        "any.only": "sortType must be either 'asc' or 'desc'",
      }),
      limit: Joi.number().integer().min(1).max(100).optional().messages({
        "number.base": "Limit must be a number",
        "number.integer": "Limit must be an integer",
        "number.min": "Limit must be at least 1",
        "number.max": "Limit cannot exceed 100",
      }),
      page: Joi.number().integer().min(1).optional().messages({
        "number.base": "Page must be a number",
        "number.integer": "Page must be an integer",
        "number.min": "Page must be at least 1",
      }),
    }),
  },

  getBankAccount: {
    params: Joi.object().keys({
      bankAccountId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Bank account ID is required",
        "any.invalid": "Bank account ID must be a valid MongoDB ObjectId",
        "any.required": "Bank account ID is required",
      }),
    }),
  },

  updateBankAccount: {
    params: Joi.object().keys({
      bankAccountId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Bank account ID is required",
        "any.invalid": "Bank account ID must be a valid MongoDB ObjectId",
        "any.required": "Bank account ID is required",
      }),
    }),
    body: Joi.object().keys({
      bankName: Joi.string().optional().max(100).messages({
        "string.max": "Bank name cannot exceed 100 characters",
      }),
      bankCountry: Joi.string().optional().max(100).messages({
        "string.max": "Bank country cannot exceed 100 characters",
      }),
      bankIban: Joi.string().optional().min(15).max(34).messages({
        "string.min": "Bank IBAN must be at least 15 characters",
        "string.max": "Bank IBAN cannot exceed 34 characters",
      }),
      bankSwiftCode: Joi.string().optional().max(11).messages({
        "string.max": "Bank SWIFT code cannot exceed 11 characters",
      }),
      accountName: Joi.string().optional().max(100).messages({
        "string.max": "Account name cannot exceed 100 characters",
      }),
      isActive: Joi.boolean().optional().messages({
        "boolean.base": "isActive must be a boolean",
      }),
    }),
  },

  deleteBankAccount: {
    params: Joi.object().keys({
      bankAccountId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Bank account ID is required",
        "any.invalid": "Bank account ID must be a valid MongoDB ObjectId",
        "any.required": "Bank account ID is required",
      }),
    }),
  },
};
