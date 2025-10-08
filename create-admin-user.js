const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log("Creating admin user...");

    // Check if admin user already exists
    const existingAdmin = await prisma.employee.findUnique({
      where: { email: "nafiza.aobs@gmail.com" },
    });

    if (existingAdmin) {
      console.log(
        "Admin user already exists with email: nafiza.aobs@gmail.com"
      );
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("Nafiz@1122", 8);

    // Get all available permissions
    const allPermissions = [
      // Client Management
      "CREATE_CLIENT",
      "READ_CLIENT",
      "UPDATE_CLIENT",
      "DELETE_CLIENT",

      // Service Management
      "CREATE_SERVICE",
      "READ_SERVICE",
      "UPDATE_SERVICE",
      "DELETE_SERVICE",

      // Invoice Management
      "CREATE_INVOICE",
      "READ_INVOICE",
      "UPDATE_INVOICE",
      "DELETE_INVOICE",

      // Task Management
      "CREATE_TASK",
      "READ_TASK",
      "UPDATE_TASK",
      "DELETE_TASK",
      "ASSIGN_TASK",

      // Bank Account Management
      "CREATE_BANK_ACCOUNT",
      "READ_BANK_ACCOUNT",
      "UPDATE_BANK_ACCOUNT",
      "DELETE_BANK_ACCOUNT",

      // Report Management
      "GENERATE_REPORTS",
      "VIEW_REPORTS",

      // User Management
      "CREATE_EMPLOYEE",
      "READ_EMPLOYEE",
      "UPDATE_EMPLOYEE",
      "DELETE_EMPLOYEE",
      "MANAGE_EMPLOYEES",
      "ASSIGN_PERMISSIONS",

      // Branch Management
      "CREATE_BRANCH",
      "READ_BRANCH",
      "UPDATE_BRANCH",
      "DELETE_BRANCH",

      // Payment Methods Management
      "CREATE_PAYMENT_METHOD",
      "READ_PAYMENT_METHOD",
      "UPDATE_PAYMENT_METHOD",
      "DELETE_PAYMENT_METHOD",
    ];

    // Create the admin user
    const adminUser = await prisma.employee.create({
      data: {
        email: "nafiza.aobs@gmail.com",
        name: "Admin User",
        password: hashedPassword,
        role: "ADMIN",
        nationalIdentificationNumber: "ADMIN001", // Admin national ID
        dateOfBirth: new Date("1990-01-01"), // Default date of birth
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
