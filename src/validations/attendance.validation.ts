import Joi from "joi";
import { objectId } from "./custom.validation";

export const attendanceValidation = {
  checkIn: Joi.object().keys({
    notes: Joi.string().optional().max(500).messages({
      "string.max": "Notes cannot exceed 500 characters",
    }),
  }),

  checkOut: Joi.object().keys({
    notes: Joi.string().optional().max(500).messages({
      "string.max": "Notes cannot exceed 500 characters",
    }),
  }),

  getMyAttendance: Joi.object().keys({
    query: Joi.object().keys({
      date: Joi.date().optional().messages({
        "date.base": "Date must be a valid date",
      }),
    }),
  }),

  getMyAttendanceRange: Joi.object().keys({
    query: Joi.object().keys({
      startDate: Joi.date().required().messages({
        "date.base": "Start date must be a valid date",
        "any.required": "Start date is required",
      }),
      endDate: Joi.date().required().messages({
        "date.base": "End date must be a valid date",
        "any.required": "End date is required",
      }),
    }),
  }),

  getMyAttendanceStats: Joi.object().keys({
    query: Joi.object().keys({
      startDate: Joi.date().required().messages({
        "date.base": "Start date must be a valid date",
        "any.required": "Start date is required",
      }),
      endDate: Joi.date().required().messages({
        "date.base": "End date must be a valid date",
        "any.required": "End date is required",
      }),
    }),
  }),

  getBranchAttendance: Joi.object().keys({
    params: Joi.object().keys({
      branchId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Branch ID is required",
        "any.invalid": "Branch ID must be a valid MongoDB ObjectId",
      }),
    }),
    query: Joi.object().keys({
      startDate: Joi.date().required().messages({
        "date.base": "Start date must be a valid date",
        "any.required": "Start date is required",
      }),
      endDate: Joi.date().required().messages({
        "date.base": "End date must be a valid date",
        "any.required": "End date is required",
      }),
    }),
  }),

  getTodayBranchAttendance: Joi.object().keys({
    params: Joi.object().keys({
      branchId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Branch ID is required",
        "any.invalid": "Branch ID must be a valid MongoDB ObjectId",
      }),
    }),
  }),

  getBranchAttendanceStats: Joi.object().keys({
    params: Joi.object().keys({
      branchId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Branch ID is required",
        "any.invalid": "Branch ID must be a valid MongoDB ObjectId",
      }),
    }),
    query: Joi.object().keys({
      date: Joi.date().optional().messages({
        "date.base": "Date must be a valid date",
      }),
    }),
  }),

  markAttendance: Joi.object().keys({
    params: Joi.object().keys({
      employeeId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Employee ID is required",
        "any.invalid": "Employee ID must be a valid MongoDB ObjectId",
      }),
    }),
    body: Joi.object().keys({
      date: Joi.date().required().messages({
        "date.base": "Date must be a valid date",
        "any.required": "Date is required",
      }),
      status: Joi.string()
        .valid("PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE", "HOLIDAY")
        .required()
        .messages({
          "string.empty": "Status is required",
          "any.only":
            "Status must be one of: PRESENT, ABSENT, LATE, HALF_DAY, LEAVE, HOLIDAY",
          "any.required": "Status is required",
        }),
      checkIn: Joi.date().optional().messages({
        "date.base": "Check-in time must be a valid date",
      }),
      checkOut: Joi.date().optional().messages({
        "date.base": "Check-out time must be a valid date",
      }),
      notes: Joi.string().optional().max(500).messages({
        "string.max": "Notes cannot exceed 500 characters",
      }),
    }),
  }),

  getEmployeeAttendance: Joi.object().keys({
    employeeId: Joi.string().custom(objectId).required().messages({
      "string.empty": "Employee ID is required",
      "any.invalid": "Employee ID must be a valid MongoDB ObjectId",
    }),
  }),

  getEmployeeAttendanceRange: Joi.object().keys({
    params: Joi.object().keys({
      employeeId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Employee ID is required",
        "any.invalid": "Employee ID must be a valid MongoDB ObjectId",
      }),
    }),
    query: Joi.object().keys({
      startDate: Joi.date().required().messages({
        "date.base": "Start date must be a valid date",
        "any.required": "Start date is required",
      }),
      endDate: Joi.date().required().messages({
        "date.base": "End date must be a valid date",
        "any.required": "End date is required",
      }),
    }),
  }),

  getEmployeeAttendanceStats: Joi.object().keys({
    params: Joi.object().keys({
      employeeId: Joi.string().custom(objectId).required().messages({
        "string.empty": "Employee ID is required",
        "any.invalid": "Employee ID must be a valid MongoDB ObjectId",
      }),
    }),
    query: Joi.object().keys({
      startDate: Joi.date().required().messages({
        "date.base": "Start date must be a valid date",
        "any.required": "Start date is required",
      }),
      endDate: Joi.date().required().messages({
        "date.base": "End date must be a valid date",
        "any.required": "End date is required",
      }),
    }),
  }),
};
