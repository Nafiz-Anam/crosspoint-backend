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
      accountName: Joi.string().required().max(100).messages({
        "string.empty": "Account name is required",
        "string.max": "Account name cannot exceed 100 characters",
        "any.required": "Account name is required",
      }),
      accountNumber: Joi.string().required().max(50).messages({
        "string.empty": "Account number is required",
        "string.max": "Account number cannot exceed 50 characters",
        "any.required": "Account number is required",
      }),
      bankIban: Joi.string().optional().allow("").min(15).max(34).messages({
        "string.min": "Bank IBAN must be at least 15 characters",
        "string.max": "Bank IBAN cannot exceed 34 characters",
      }),
      bankSwiftCode: Joi.string().optional().allow("").max(11).messages({
        "string.max": "Bank SWIFT code cannot exceed 11 characters",
      }),
      isActive: Joi.boolean().optional().messages({
        "boolean.base": "isActive must be a boolean",
      }),
    }),
  },

  getBankAccounts: {
    query: Joi.object().keys({
      search: Joi.string().optional().messages({
        "string.base": "Search must be a string",
      }),
      bankName: Joi.string().optional().messages({
        "string.base": "Bank name must be a string",
      }),
      accountNumber: Joi.string().optional().max(50).messages({
        "string.max": "Account number cannot exceed 50 characters",
      }),
      bankCurrency: Joi.string().uppercase().length(3).optional().messages({
        "string.length": "Currency must be a 3-letter ISO code",
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
      bankName: Joi.string().required().max(100).messages({
        "string.empty": "Bank name is required",
        "string.max": "Bank name cannot exceed 100 characters",
        "any.required": "Bank name is required",
      }),
      accountName: Joi.string().required().max(100).messages({
        "string.empty": "Account name is required",
        "string.max": "Account name cannot exceed 100 characters",
        "any.required": "Account name is required",
      }),
      accountNumber: Joi.string().required().max(50).messages({
        "string.empty": "Account number is required",
        "string.max": "Account number cannot exceed 50 characters",
        "any.required": "Account number is required",
      }),
      bankIban: Joi.string().optional().allow("").min(15).max(34).messages({
        "string.min": "Bank IBAN must be at least 15 characters",
        "string.max": "Bank IBAN cannot exceed 34 characters",
      }),
      bankSwiftCode: Joi.string().optional().allow("").max(11).messages({
        "string.max": "Bank SWIFT code cannot exceed 11 characters",
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
