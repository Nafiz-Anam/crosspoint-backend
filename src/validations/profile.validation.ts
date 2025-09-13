import Joi from "joi";

export const profileValidation = {
  updateProfile: Joi.object().keys({
    body: Joi.object()
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
  }),

  changePassword: Joi.object().keys({
    body: Joi.object().keys({
      currentPassword: Joi.string().required().messages({
        "any.required": "Current password is required",
      }),
      newPassword: Joi.string()
        .min(10)
        .pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])\S{10,}$/
        )
        .required()
        .messages({
          "any.required": "New password is required",
          "string.min": "Password must be at least 10 characters long",
          "string.pattern.base":
            "Password must include uppercase, lowercase, digit, and special character",
        }),
    }),
  }),
};

export default profileValidation;
