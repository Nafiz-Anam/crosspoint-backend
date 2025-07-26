import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Crosspoint API (Italian Client)",
    version: "1.0.0",
    description:
      "API documentation for the Crosspoint application backend (Italian client)",
  },
  servers: [
    {
      url: "/v1",
      description: "Main API server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "user-uuid-123" },
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          name: { type: "string", example: "John Doe" },
          role: {
            type: "string",
            enum: ["ADMIN", "HR", "EMPLOYEE"],
            example: "EMPLOYEE",
          },
          branchId: { type: "string", example: "BR-001" },
          isEmailVerified: { type: "boolean", example: true },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
        },
      },
      Branch: {
        type: "object",
        properties: {
          id: { type: "string", example: "branch-uuid-123" },
          branchId: { type: "string", example: "BR-001" },
          name: { type: "string", example: "Milan Central" },
          address: { type: "string", example: "Via Roma 123" },
          city: { type: "string", example: "Milano" },
          postalCode: { type: "string", example: "20100" },
          province: { type: "string", example: "MI" },
          phone: { type: "string", example: "+39 02 1234567" },
          email: {
            type: "string",
            format: "email",
            example: "milan@company.it",
          },
          isActive: { type: "boolean", example: true },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
        },
      },
      Client: {
        type: "object",
        properties: {
          id: { type: "string", example: "client-uuid-123" },
          name: { type: "string", example: "Acme Corporation" },
          email: {
            type: "string",
            format: "email",
            example: "client@acme.com",
          },
          phone: { type: "string", example: "+39 02 1234567" },
          address: { type: "string", example: "Via Roma 123, Milano" },
          city: { type: "string", example: "Milano" },
          postalCode: { type: "string", example: "20100" },
          province: { type: "string", example: "MI" },
          isActive: { type: "boolean", example: true },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
        },
      },
      Invoice: {
        type: "object",
        properties: {
          id: { type: "string", example: "invoice-uuid-123" },
          invoiceNumber: { type: "string", example: "INV-BR001-20241225-001" },
          clientId: { type: "string", example: "CUST-BR001-001" },
          amount: { type: "number", format: "float", example: 1500.75 },
          dueDate: { type: "string", format: "date", example: "2024-12-31" },
          status: {
            type: "string",
            enum: ["PENDING", "PAID", "OVERDUE", "CANCELLED"],
            example: "PAID",
          },
          notes: { type: "string", example: "Payment for December services" },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
        },
      },
      Attendance: {
        type: "object",
        properties: {
          id: { type: "string", example: "attendance-uuid-123" },
          userId: { type: "string", example: "user-uuid-123" },
          date: { type: "string", format: "date", example: "2024-12-25" },
          checkIn: {
            type: "string",
            format: "date-time",
            example: "2024-12-25T08:30:00Z",
          },
          checkOut: {
            type: "string",
            format: "date-time",
            example: "2024-12-25T17:30:00Z",
          },
          totalHours: { type: "number", example: 9.0 },
          status: {
            type: "string",
            enum: ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE", "HOLIDAY"],
            example: "PRESENT",
          },
          notes: { type: "string", example: "Optional notes" },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
        },
      },
      Service: {
        type: "object",
        properties: {
          id: { type: "string", example: "service-uuid-123" },
          name: { type: "string", example: "Consulting" },
          price: { type: "number", format: "float", example: 100.0 },
          description: {
            type: "string",
            example: "Business consulting service",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-16T12:00:00Z",
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation error" },
          errors: {
            type: "array",
            items: { type: "string" },
            example: ["Email is required", "Password is too short"],
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  // Path to the API docs (adjust as needed)
  apis: [
    "./src/routes/v1/**/*.ts",
    "./src/controllers/**/*.ts",
    "./src/models/**/*.ts",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwaggerDocs(app: Express) {
  app.use("/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
