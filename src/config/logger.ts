import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import config from "./config";
import path from "path";

const logDirectory = path.join(__dirname, "../../public/logs");

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: `${info.message}\n${info.stack}` });
  }
  return info;
});

// Type the transports array properly to accept any winston transport
const transports: winston.transport[] = [
  new winston.transports.Console({
    stderrLevels: ["error"],
    handleExceptions: true,
    handleRejections: true,
  }),
];

// Only add file transport in non-development environments
if (config.env !== "development") {
  transports.push(
    new DailyRotateFile({
      filename: "application-%DATE%.log",
      dirname: logDirectory,
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "90d", // Keep logs for 90 days
      level: "info",
    })
  );
}

const logger = winston.createLogger({
  level: config.env === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    enumerateErrorFormat(),
    config.env === "development"
      ? winston.format.colorize() // Colorize logs for development for better readability
      : winston.format.uncolorize(), // Uncolored for production or non-development environments
    winston.format.splat(),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}` // Custom log format including timestamp
    )
  ),
  transports: transports,
});

export default logger;
