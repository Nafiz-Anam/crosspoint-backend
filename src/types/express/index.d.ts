declare global {
  namespace Express {
    interface Employee {
      id: string;
      // Add other properties as needed
    }
    interface Request {
      employee?: Employee;
      employeePermissions?: string[];
    }
  }
}

export {};
