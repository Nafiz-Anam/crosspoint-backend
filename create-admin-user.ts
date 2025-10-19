import { PrismaClient, Role, Permission } from "@prisma/client";
import { encryptPassword } from "./src/utils/encryption";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log("Creating admin user...");

    // Check if admin user already exists
    const existingAdmin = await prisma.employee.findUnique({
      where: { email: "admin@gmail.com" },
    });

    if (existingAdmin) {
      console.log("Admin user already exists with email: admin@gmail.com");
      return;
    }

    // Hash the password
    const hashedPassword = await encryptPassword("Nafiz@1122");

    // Get all available permissions
    const allPermissions: Permission[] = [
      // Client Management
      Permission.CREATE_CLIENT,
      Permission.READ_CLIENT,
      Permission.UPDATE_CLIENT,
      Permission.DELETE_CLIENT,

      // Service Management
      Permission.CREATE_SERVICE,
      Permission.READ_SERVICE,
      Permission.UPDATE_SERVICE,
      Permission.DELETE_SERVICE,

      // Invoice Management
      Permission.CREATE_INVOICE,
      Permission.READ_INVOICE,
      Permission.UPDATE_INVOICE,
      Permission.DELETE_INVOICE,

      // Task Management
      Permission.CREATE_TASK,
      Permission.READ_TASK,
      Permission.UPDATE_TASK,
      Permission.DELETE_TASK,
      Permission.ASSIGN_TASK,

      // Bank Account Management
      Permission.CREATE_BANK_ACCOUNT,
      Permission.READ_BANK_ACCOUNT,
      Permission.UPDATE_BANK_ACCOUNT,
      Permission.DELETE_BANK_ACCOUNT,

      // Report Management
      Permission.GENERATE_REPORTS,
      Permission.VIEW_REPORTS,

      // User Management
      Permission.CREATE_EMPLOYEE,
      Permission.READ_EMPLOYEE,
      Permission.UPDATE_EMPLOYEE,
      Permission.DELETE_EMPLOYEE,
      Permission.MANAGE_EMPLOYEES,
      Permission.ASSIGN_PERMISSIONS,

      // Branch Management
      Permission.CREATE_BRANCH,
      Permission.READ_BRANCH,
      Permission.UPDATE_BRANCH,
      Permission.DELETE_BRANCH,

      // Payment Methods Management
      Permission.CREATE_PAYMENT_METHOD,
      Permission.READ_PAYMENT_METHOD,
      Permission.UPDATE_PAYMENT_METHOD,
      Permission.DELETE_PAYMENT_METHOD,
    ];

    // Create the admin user
    const adminUser = await prisma.employee.create({
      data: {
        email: "admin@gmail.com",
        name: "Admin User",
        password: hashedPassword,
        role: Role.ADMIN,
        dateOfBirth: new Date("1990-01-01"),
        nationalIdentificationNumber: "ADMIN001", // ADD THIS LINE
        isEmailVerified: true,
        isActive: true,
        permissions: allPermissions,
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@gmail.com");
    console.log("🔑 Password: Nafiz@1122");
    console.log("👤 Role: ADMIN");
    console.log("🔐 Permissions: All permissions granted");
    console.log("🆔 User ID:", adminUser.id);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();
