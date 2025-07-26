import Joi from "joi";
import { objectId } from "./custom.validation";

export const branchValidation = {
  createBranch: Joi.object().keys({
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(100).messages({
        "string.empty": "Branch name is required",
        "string.min": "Branch name must be at least 2 characters long",
        "string.max": "Branch name cannot exceed 100 characters",
      }),
      address: Joi.string().required().min(5).max(200).messages({
        "string.empty": "Address is required",
        "string.min": "Address must be at least 5 characters long",
        "string.max": "Address cannot exceed 200 characters",
      }),
      city: Joi.string().required().min(2).max(50).messages({
        "string.empty": "City is required",
        "string.min": "City must be at least 2 characters long",
        "string.max": "City cannot exceed 50 characters",
      }),
      postalCode: Joi.string()
        .required()
        .pattern(/^\d{5}$/)
        .messages({
          "string.empty": "Postal code is required",
          "string.pattern.base":
            "Postal code must be 5 digits (Italian CAP format)",
        }),
      province: Joi.string()
        .required()
        .pattern(/^[A-Z]{2}$/)
        .uppercase()
        .messages({
          "string.empty": "Province is required",
          "string.pattern.base":
            "Province must be 2 letters (Italian province code)",
        }),
      phone: Joi.string()
        .optional()
        .pattern(/^(\+39\s?)?\d{2,4}\s?\d{3,4}\s?\d{3,4}$/)
        .messages({
          "string.pattern.base": "Phone number must be in valid Italian format",
        }),
      email: Joi.string().optional().email().messages({
        "string.email": "Email must be a valid email address",
      }),
    }),
  }),

  getBranch: Joi.object().keys({
    params: Joi.object().keys({
      id: Joi.string().custom(objectId).required().messages({
        "string.empty": "Branch ID is required",
        "any.invalid": "Branch ID must be a valid MongoDB ObjectId",
      }),
    }),
  }),

  getBranchByBranchId: Joi.object().keys({
    params: Joi.object().keys({
      branchId: Joi.string()
        .required()
        .pattern(/^BR-\d{3}$/)
        .messages({
          "string.empty": "Branch ID is required",
          "string.pattern.base":
            "Branch ID must be in format BR-001, BR-002, etc.",
        }),
    }),
  }),

  updateBranch: Joi.object().keys({
    params: Joi.object().keys({
      id: Joi.string().custom(objectId).required().messages({
        "string.empty": "Branch ID is required",
        "any.invalid": "Branch ID must be a valid MongoDB ObjectId",
      }),
    }),
    body: Joi.object().keys({
      name: Joi.string().optional().min(2).max(100).messages({
        "string.min": "Branch name must be at least 2 characters long",
        "string.max": "Branch name cannot exceed 100 characters",
      }),
      address: Joi.string().optional().min(5).max(200).messages({
        "string.min": "Address must be at least 5 characters long",
        "string.max": "Address cannot exceed 200 characters",
      }),
      city: Joi.string().optional().min(2).max(50).messages({
        "string.min": "City must be at least 2 characters long",
        "string.max": "City cannot exceed 50 characters",
      }),
      postalCode: Joi.string()
        .optional()
        .pattern(/^\d{5}$/)
        .messages({
          "string.pattern.base":
            "Postal code must be 5 digits (Italian CAP format)",
        }),
      province: Joi.string()
        .optional()
        .pattern(/^[A-Z]{2}$/)
        .uppercase()
        .messages({
          "string.pattern.base":
            "Province must be 2 letters (Italian province code)",
        }),
      phone: Joi.string()
        .optional()
        .pattern(/^(\+39\s?)?\d{2,4}\s?\d{3,4}\s?\d{3,4}$/)
        .messages({
          "string.pattern.base": "Phone number must be in valid Italian format",
        }),
      email: Joi.string().optional().email().messages({
        "string.email": "Email must be a valid email address",
      }),
      isActive: Joi.boolean().optional(),
    }),
  }),

  deleteBranch: Joi.object().keys({
    params: Joi.object().keys({
      id: Joi.string().custom(objectId).required().messages({
        "string.empty": "Branch ID is required",
        "any.invalid": "Branch ID must be a valid MongoDB ObjectId",
      }),
    }),
  }),

  generateEmployeeId: Joi.object().keys({
    params: Joi.object().keys({
      branchId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Branch ID is required",
        "any.invalid": "Branch ID must be a valid MongoDB ObjectId",
      }),
    }),
  }),

  generateCustomerId: Joi.object().keys({
    params: Joi.object().keys({
      branchId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Branch ID is required",
        "any.invalid": "Branch ID must be a valid MongoDB ObjectId",
      }),
    }),
  }),

  generateInvoiceId: Joi.object().keys({
    params: Joi.object().keys({
      branchId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Branch ID is required",
        "any.invalid": "Branch ID must be a valid MongoDB ObjectId",
      }),
    }),
    query: Joi.object().keys({
      year: Joi.number().integer().min(2020).max(2030).optional().messages({
        "number.base": "Year must be a number",
        "number.integer": "Year must be an integer",
        "number.min": "Year must be at least 2020",
        "number.max": "Year cannot exceed 2030",
      }),
      month: Joi.number().integer().min(1).max(12).optional().messages({
        "number.base": "Month must be a number",
        "number.integer": "Month must be an integer",
        "number.min": "Month must be at least 1",
        "number.max": "Month cannot exceed 12",
      }),
      date: Joi.number().integer().min(1).max(31).optional().messages({
        "number.base": "Date must be a number",
        "number.integer": "Date must be an integer",
        "number.min": "Date must be at least 1",
        "number.max": "Date cannot exceed 31",
      }),
    }),
  }),
};
