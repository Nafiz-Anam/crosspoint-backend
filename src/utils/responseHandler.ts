import { Response } from "express";

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: Error;
}

interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

type ResponseData<T> = SuccessResponse<T> | ErrorResponse;

const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  data: T | null = null,
  message: string = "",
  error: Error | null = null
): Response => {
  const baseResponse = {
    success,
    message,
    ...(error && { error }), // Conditionally add the error object if present
  };

  let responseData: ResponseData<T> = success
    ? { ...baseResponse, ...(data !== null && { data }) } // Include `data` only if it's not null
    : baseResponse;

  return res.status(statusCode).json(responseData);
};

export default sendResponse;
