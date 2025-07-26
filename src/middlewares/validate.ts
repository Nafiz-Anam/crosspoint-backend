import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import { Request, Response, NextFunction } from "express";
import Joi, { Schema } from "joi";

export function validate(schema: Schema) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await schema.validateAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof Joi.ValidationError) {
        const validationError = new ApiError(
          httpStatus.BAD_REQUEST,
          error.details[0].message
        );
        next(validationError);
      } else {
        console.error(error);
        const validationError = new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Internal server error"
        );
        next(validationError);
      }
    }
  };
}
