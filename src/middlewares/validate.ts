import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import { Request, Response, NextFunction } from "express";
import Joi, { Schema } from "joi";

export function validate(
  schema: Schema,
  source: "body" | "query" | "params" = "body"
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      let dataToValidate;
      switch (source) {
        case "query":
          dataToValidate = req.query;
          break;
        case "params":
          dataToValidate = req.params;
          break;
        case "body":
        default:
          dataToValidate = req.body;
          break;
      }

      await schema.validateAsync(dataToValidate);
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
