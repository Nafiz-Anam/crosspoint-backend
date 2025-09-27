import passport from "passport";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import { NextFunction, Request, Response } from "express";

const verifyCallback =
  (
    req: Request,
    resolve: (value?: unknown) => void,
    reject: (reason?: unknown) => void
  ) =>
  async (err: unknown, user: any, info: unknown) => {
    if (err || info || !user) {
      return reject(
        new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate")
      );
    }
    req.employee = user;
    req.user = user; // For compatibility
    resolve();
  };

const auth = () => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await new Promise((resolve, reject) => {
      passport.authenticate(
        "jwt",
        { session: false },
        verifyCallback(req, resolve, reject)
      )(req, res, next);
    });
    next();
  } catch (err) {
    next(err);
  }
};

export default auth;
