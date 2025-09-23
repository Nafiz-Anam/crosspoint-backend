import Joi from "joi";

export const companyInfoValidation = {
  updateCompanyInfo: Joi.object().keys({
    id: Joi.string().optional(),
    companyName: Joi.string().optional().max(100).messages({
      "string.max": "Company name cannot exceed 100 characters",
    }),
    tagline: Joi.string().optional().max(200).messages({
      "string.max": "Tagline cannot exceed 200 characters",
    }),
    address: Joi.string().optional().max(200).messages({
      "string.max": "Address cannot exceed 200 characters",
    }),
    city: Joi.string().optional().max(100).messages({
      "string.max": "City cannot exceed 100 characters",
    }),
    phone: Joi.string().optional().max(50).messages({
      "string.max": "Phone cannot exceed 50 characters",
    }),
    email: Joi.string().email().optional().messages({
      "string.email": "Please provide a valid email address",
    }),
    website: Joi.string().optional().max(100).messages({
      "string.max": "Website cannot exceed 100 characters",
    }),
    logo: Joi.string().optional().allow("").messages({
      "string.uri": "Please provide a valid logo URL or data URL",
    }),
    createdAt: Joi.date().optional(),
    updatedAt: Joi.date().optional(),
  }),
};
