import express from "express";
import authRoute from "./AuthRoute/auth.route";
import userRoute from "./UserRoute/user.route";
import permissionRoute from "./PermissionRoute/permission.route";
import serviceRoute from "./ServiceRoute/service.route";
import clientRoute from "./ClientRoute/client.route";
import invoiceRoute from "./InvoiceRoute/invoice.route";
import branchRoute from "./BranchRoute/branch.route";
import attendanceRoute from "./AttendanceRoute/attendance.route";

const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/users",
    route: userRoute,
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
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
