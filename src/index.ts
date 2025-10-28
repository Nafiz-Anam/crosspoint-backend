/// <reference path="./types/express.d.ts" />
import { Server } from "http";
import app from "./app/app";
import prisma from "./client"; // Prisma client for database operations
import config from "./config/config"; // Application configuration settings
import logger from "./config/logger"; // Custom logger for logging
import cronService from "./services/cron.service"; // Cron job service

// Set Node.js timezone to Italian timezone
process.env.TZ = config.timezone;

let server: Server;

// Connect to the database before starting the server
prisma.$connect().then(() => {
  logger.info("Connected to SQL Database");

  // Initialize cron jobs
  cronService.initializeCronJobs();

  // Start the Express server after successful database connection
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});

// Gracefully closes the server and exits the process
const exitHandler = () => {
  if (server) {
    server.close(async () => {
      logger.info("Server closed");

      // Disconnect from the database before exiting
      // await prisma.$disconnect();
      // logger.info("Disconnected from database");

      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

// Handles unexpected errors
const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  exitHandler();
};

// Listen for uncaught exceptions and unhandled promise rejections
process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

// Listen for SIGTERM signal (e.g., from Kubernetes or a manual stop) to gracefully shut down
process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();

    // Optionally add database disconnection and/or other cleanup logic here
  }
});
