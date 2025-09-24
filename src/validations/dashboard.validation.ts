import { Joi } from "celebrate";

export const dashboardValidation = {
  getDashboardStats: {
    query: Joi.object().keys({
      branchId: Joi.string().uuid().optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
    }),
  },
  getWeeklyEarnings: {
    query: Joi.object().keys({
      branchId: Joi.string().uuid().optional(),
    }),
  },
  getEarningsData: {
    query: Joi.object().keys({
      branchId: Joi.string().uuid().optional(),
      period: Joi.string().valid("week", "month", "year").optional(),
    }),
  },
  getInvoiceStats: {
    query: Joi.object().keys({
      branchId: Joi.string().uuid().optional(),
      period: Joi.string().valid("week", "month", "quarter", "year").optional(),
    }),
  },
  getProjectsOverview: {
    query: Joi.object().keys({
      branchId: Joi.string().uuid().optional(),
    }),
  },
};
