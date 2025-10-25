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
      branchId?: string | null; // Branch ID for branch-based filtering
      branch?: {
        id: string;
        branchId: string;
        name: string;
      } | null; // Branch information
      employeePermissions: PrismaPermission[]; // Array of Prisma Permission enum values
    }

    // User interface for compatibility
    interface User {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
      branchId?: string | null;
      branch?: {
        id: string;
        branchId: string;
        name: string;
      } | null;
      employeePermissions?: PrismaPermission[];
    }

    // Extend the Request interface to include your custom properties
    interface Request {
      employee?: Employee; // The authenticated employee object
      user?: User; // Alias for compatibility
      employeePermissions?: PrismaPermission[]; // The array of permissions for convenience
      branchFilter?: {
        branchId?: string;
        role: Role;
      }; // Branch filtering information for managers
      sessionInfo?: {
        sessionId?: string;
        deviceInfo?: string;
        ipAddress?: string;
        userAgent?: string;
      }; // Session information for tracking
    }
  }
}

// This export is necessary to make the declaration file a module,
// preventing it from polluting the global namespace unnecessarily while still
// allowing the global declarations to work.
export {};
