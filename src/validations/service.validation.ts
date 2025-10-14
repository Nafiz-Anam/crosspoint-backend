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
        .valid(
          "CAF",
          "Patronato",
          "Immigrazione",
          "Partita IVA",
          "Reparto Legale",
          "Varie pratiche"
        )
        .messages({
          "any.only":
            "Category must be one of: CAF, Patronato, Immigrazione, Partita IVA, Reparto Legale, Varie pratiche",
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
          .valid(
            "CAF",
            "Patronato",
            "Immigrazione",
            "Partita IVA",
            "Reparto Legale",
            "Varie pratiche"
          )
          .messages({
            "any.only":
              "Category must be one of: CAF, Patronato, Immigrazione, Partita IVA, Reparto Legale, Varie pratiche",
          }),
      })
      .min(1),
  },

  getServices: {
    query: Joi.object().keys({
      search: Joi.string().optional(),
      name: Joi.string().optional(),
      category: Joi.string().optional(),
      sortBy: Joi.string().optional(),
      sortType: Joi.string().valid("asc", "desc").optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      page: Joi.number().integer().min(1).optional(),
    }),
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
