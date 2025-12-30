import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import passport from "passport";
import httpStatus from "http-status";
import path from "path";
import config from "../config/config";
import morgan from "../config/morgan";
import xss from "../middlewares/xss";
import { jwtStrategy } from "../config/passport";
import { authLimiter, globalLimiter } from "../middlewares/rateLimiter";
import routes from "../routes/v1";
import { errorConverter, errorHandler } from "../middlewares/error";
import ApiError from "../utils/ApiError";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import { setupSwaggerDocs } from "../config/swagger";

const app = express();

// trust proxy
app.set("trust proxy", true);

if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// parse json request body with increased limit for image uploads
app.use(express.json({ limit: "10mb" }));

// parse cookie request
app.use(cookieParser());

// parse urlencoded request body with increased limit
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// sanitize request data
app.use(xss());

// prevent http parameter pollution
app.use(hpp());

// limit repeated failed requests to auth endpoints
if (config.env === "production") {
  app.use(globalLimiter);
  app.use("/v1/auth", authLimiter);
}

// gzip compression
app.use(compression());

// enable cors
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-client-type"],
  })
);
app.options("*", cors());

// jwt authentication
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);



// Swagger API docs
setupSwaggerDocs(app);

// v1 api routes
app.use("/v1", routes);

// Serve static files from uploads directory
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

// default welcome route
app.get("/", (req, res) => {
  res.status(httpStatus.OK).send("Welcome to the backend API server!");
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
