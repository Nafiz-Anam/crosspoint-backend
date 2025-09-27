import Joi from "joi";
import { passwordRegex } from "./custom.validation";

export const profileValidation = {
  updateProfile: Joi.object()
    .keys({
      name: Joi.string().min(2).max(100).optional().messages({
        "string.min": "Name must be at least 2 characters long",
        "string.max": "Name cannot exceed 100 characters",
      }),
      email: Joi.string().email().optional().messages({
        "string.email": "Please provide a valid email address",
      }),
    })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),

  changePassword: Joi.object().keys({
    currentPassword: Joi.string().required().messages({
      "any.required": "Current password is required",
    }),
    newPassword: Joi.string().pattern(passwordRegex).required().messages({
      "any.required": "New password is required",
      "string.pattern.base":
        "Password must be at least 10 characters long, with at least one uppercase letter, one lowercase letter, one digit, and one special character, without spaces",
    }),
  }),
};

export default profileValidation;
