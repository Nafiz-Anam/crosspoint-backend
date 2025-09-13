import express from "express";
import authRoute from "./AuthRoute/auth.route";
import employeeRoute from "./EmployeeRoute/employee.route";
import permissionRoute from "./PermissionRoute/permission.route";
import serviceRoute from "./ServiceRoute/service.route";
import clientRoute from "./ClientRoute/client.route";
import invoiceRoute from "./InvoiceRoute/invoice.route";
import branchRoute from "./BranchRoute/branch.route";
import attendanceRoute from "./AttendanceRoute/attendance.route";
import bankAccountRoute from "./BankAccountRoute/bankAccount.route";
import dashboardRoute from "./DashboardRoute/dashboard.route";
import profileRoute from "./ProfileRoute/profile.route";

const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/employees",
    route: employeeRoute,
  },
  {
    path: "/permissions",
    route: permissionRoute,
  },
  {
    path: "/branches",
    route: branchRoute,
  },
  {
    path: "/services",
    route: serviceRoute,
  },
  {
    path: "/clients",
    route: clientRoute,
  },
  {
    path: "/invoices",
    route: invoiceRoute,
  },
  {
    path: "/attendance",
    route: attendanceRoute,
  },
  {
    path: "/bank-accounts",
    route: bankAccountRoute,
  },
  {
    path: "/dashboard",
    route: dashboardRoute,
  },
  {
    path: "/profile",
    route: profileRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
