/// <reference types="express" />
import { Permission } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name?: string;
      role: string;
    }
    interface Request {
      user?: User;
      userPermissions?: Permission[];
    }
  }
}

export {};
 