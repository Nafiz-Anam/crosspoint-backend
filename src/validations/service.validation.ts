import Joi from "joi";

export const serviceValidation = {
  createService: {
    body: Joi.object().keys({
      name: Joi.string().required().max(100).messages({
        "string.max": "Service name cannot exceed 100 characters",
      }),
      price: Joi.number().required().min(0).messages({
        "number.min": "Price must be a positive number",
      }),
      category: Joi.string()
        .optional()
        .valid("Consulting", "Development", "Design")
        .messages({
          "any.only":
            "Category must be one of: Consulting, Development, Design",
        }),
    }),
  },

  updateService: {
    params: Joi.object().keys({
      serviceId: Joi.string().required(),
    }),
    body: Joi.object()
      .keys({
        name: Joi.string().optional().max(100).messages({
          "string.max": "Service name cannot exceed 100 characters",
        }),
        price: Joi.number().optional().min(0).messages({
          "number.min": "Price must be a positive number",
        }),
        category: Joi.string()
          .optional()
          .valid("Consulting", "Development", "Design")
          .messages({
            "any.only":
              "Category must be one of: Consulting, Development, Design",
          }),
      })
      .min(1),
  },

  getService: {
    params: Joi.object().keys({
      serviceId: Joi.string().required(),
    }),
  },

  deleteService: {
    params: Joi.object().keys({
      serviceId: Joi.string().required(),
    }),
  },
};
