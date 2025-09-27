import Joi from "joi";
import { passwordRegex } from "./custom.validation";

const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
    }),
    password: Joi.string().pattern(passwordRegex).required().messages({
      "string.pattern.base":
        "Password must be at least 10 characters long, with at least one uppercase letter, one lowercase letter, one digit, and one special character, without spaces",
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty",
    }),
    confirm_password: Joi.any().valid(Joi.ref("password")).required().messages({
      "any.only": "Confirm password does not match",
      "any.required": "Confirm password is required",
      "string.empty": "Confirm password cannot be empty",
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty",
    }),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
    }),
  }),

  resetPassword: Joi.object({
    password: Joi.string().pattern(passwordRegex).required().messages({
      "string.pattern.base":
        "Password must be at least 10 characters long, with at least one uppercase letter, one lowercase letter, one digit, and one special character, without spaces",
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty",
    }),
  }),
};

export default authValidation;
