/// <reference types="express" />
import { Permission } from "@prisma/client";

declare global {
  namespace Express {
    interface Employee {
      id: string;
      email: string;
      name?: string;
      role: string;
    }
    interface Request {
      employee?: Employee;
      employeePermissions?: Permission[];
    }
  }
}

export {};
 