// src/types/express.d.ts

// This reference is important if you're using Prisma's Permission enum directly
// Make sure the path to your @prisma/client is correct relative to this file.
import {
  Permission as PrismaPermission,
  Role,
  Employee as PrismaEmployee,
} from "@prisma/client";

declare global {
  namespace Express {
    // Define the shape of the 'employee' object that will be attached to req.employee
    // This should match the 'AuthenticatedEmployee' interface you defined in auth.ts
    // and what your jwtVerify function returns.
    interface Employee extends PrismaEmployee {
      id: string;
      email: string;
      name?: string | null; // 'name' can be null as per your API response
      role: Role; // Use the actual Prisma Role enum type
      employeePermissions: PrismaPermission[]; // Array of Prisma Permission enum values
    }

    // Extend the Request interface to include your custom properties
    interface Request {
      employee?: Employee; // The authenticated employee object
      employeePermissions?: PrismaPermission[]; // The array of permissions for convenience
    }
  }
}

// This export is necessary to make the declaration file a module,
// preventing it from polluting the global namespace unnecessarily while still
// allowing the global declarations to work.
export {};
