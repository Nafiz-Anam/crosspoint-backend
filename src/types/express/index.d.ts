declare global {
  namespace Express {
    interface User {
      id: string;
      // Add other properties as needed
    }
    interface Request {
      user?: User;
      userPermissions?: string[];
    }
  }
}

export {};
