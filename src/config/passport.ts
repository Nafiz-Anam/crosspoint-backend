import prisma from "../client";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  VerifyCallback,
} from "passport-jwt";
import config from "./config";
import { TokenType, Permission } from "@prisma/client"; // Import Permission enum

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify: VerifyCallback = async (payload, done) => {
  try {
    // IMPORTANT: If NextAuth.js JWTs don't have 'type', remove or comment this check.
    if (payload.type && payload.type !== TokenType.ACCESS) {
      console.warn(
        "JWT Verification: Invalid token type detected in payload:",
        payload.type
      );
      return done(null, false, { message: "Invalid token type" });
    }

    // Fetch the employee and their associated permissions using the new schema
    const employee = await prisma.employee.findUnique({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true, // Include branch information
        permissions: true, // Directly fetch the permissions from the Employee model
        branch: {
          select: {
            id: true,
            branchId: true,
            name: true,
          },
        },
      },
      where: { id: payload.sub },
    });

    if (!employee) {
      console.log("JWT Verification: Employee not found for ID:", payload.sub);
      return done(null, false, { message: "Employee not found" });
    }

    // Construct the authenticated employee object with permissions
    const authenticatedEmployee = {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      branchId: employee.branchId, // Include branch ID
      branch: employee.branch, // Include branch information
      employeePermissions: employee.permissions, // Attach the permissions array directly
    };

    done(null, authenticatedEmployee); // Pass the employee with permissions
  } catch (error) {
    console.error("Error during JWT verification:", error);
    done(error, false, {
      message: "Internal server error during authentication",
    });
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
