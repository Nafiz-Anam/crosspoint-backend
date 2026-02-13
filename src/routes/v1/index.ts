import express from "express";
import authRoute from "./AuthRoute/auth.route";
import employeeRoute from "./EmployeeRoute/employee.route";
import serviceRoute from "./ServiceRoute/service.route";
import clientRoute from "./ClientRoute/client.route";
import invoiceRoute from "./InvoiceRoute/invoice.route";
import branchRoute from "./BranchRoute/branch.route";
import attendanceRoute from "./AttendanceRoute/attendance.route";
import bankAccountRoute from "./BankAccountRoute/bankAccount.route";
import companyInfoRoute from "./CompanyInfoRoute/companyInfo.route";
import dashboardRoute from "./DashboardRoute/dashboard.route";
import profileRoute from "./ProfileRoute/profile.route";
import taskRoute from "./task.route";
import departmentRoute from "./DepartmentRoute/department.route";
import designationRoute from "./DesignationRoute/designation.route";
import leaveRoute from "./LeaveRoute/leave.route";
import employeeDocumentRoute from "./EmployeeDocumentRoute/employeeDocument.route";

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
    path: "/company-info",
    route: companyInfoRoute,
  },
  {
    path: "/dashboard",
    route: dashboardRoute,
  },
  {
    path: "/profile",
    route: profileRoute,
  },
  {
    path: "/tasks",
    route: taskRoute,
  },
  {
    path: "/departments",
    route: departmentRoute,
  },
  {
    path: "/designations",
    route: designationRoute,
  },
  {
    path: "/leave",
    route: leaveRoute,
  },
  {
    path: "/employee-documents",
    route: employeeDocumentRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
