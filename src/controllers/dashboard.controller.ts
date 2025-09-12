import { Request, Response } from "express";
import httpStatus from "http-status";
import { PrismaClient } from "@prisma/client";
import catchAsync from "../utils/catchAsync";
import ApiError from "../utils/ApiError";
import sendResponse from "../utils/responseHandler";

const prisma = new PrismaClient();

// Get dashboard statistics
const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const { branchId, startDate, endDate } = req.query;

  // Set default date range to last 30 days if not provided
  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);

  const start = startDate ? new Date(startDate as string) : defaultStartDate;
  const end = endDate ? new Date(endDate as string) : defaultEndDate;

  // Build where clause for filtering
  const whereClause: any = {
    issuedDate: {
      gte: start,
      lte: end,
    },
  };

  if (branchId) {
    whereClause.branchId = branchId as string;
  }

  // Get invoice statistics
  const [
    totalInvoices,
    totalRevenue,
    paidInvoices,
    unpaidInvoices,
    overdueInvoices,
    recentInvoices,
    totalClients,
    totalEmployees,
    totalBranches,
    totalServices,
  ] = await Promise.all([
    // Total invoices in date range
    prisma.invoice.count({
      where: whereClause,
    }),

    // Total revenue in date range
    prisma.invoice.aggregate({
      where: whereClause,
      _sum: {
        totalAmount: true,
      },
    }),

    // Paid invoices
    prisma.invoice.count({
      where: {
        ...whereClause,
        status: "PAID",
      },
    }),

    // Unpaid invoices
    prisma.invoice.count({
      where: {
        ...whereClause,
        status: "UNPAID",
      },
    }),

    // Overdue invoices
    prisma.invoice.count({
      where: {
        ...whereClause,
        status: "OVERDUE",
      },
    }),

    // Recent invoices for the week
    prisma.invoice.findMany({
      where: {
        ...whereClause,
        issuedDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        client: true,
        branch: true,
        employee: true,
      },
      orderBy: {
        issuedDate: "desc",
      },
      take: 5,
    }),

    // Total clients
    prisma.client.count({
      where: branchId ? { branchId: branchId as string } : {},
    }),

    // Total employees
    prisma.employee.count({
      where: branchId ? { branchId: branchId as string } : {},
    }),

    // Total branches
    prisma.branch.count(),

    // Total services
    prisma.service.count(),
  ]);

  // Calculate additional metrics
  const totalRevenueAmount = totalRevenue._sum.totalAmount || 0;
  const averageInvoiceValue =
    totalInvoices > 0 ? totalRevenueAmount / totalInvoices : 0;
  const paymentRate =
    totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

  // Get previous period data for comparison
  const previousStart = new Date(start);
  const previousEnd = new Date(end);
  const periodLength = end.getTime() - start.getTime();
  previousStart.setTime(previousStart.getTime() - periodLength);
  previousEnd.setTime(previousEnd.getTime() - periodLength);

  const previousRevenue = await prisma.invoice.aggregate({
    where: {
      ...whereClause,
      issuedDate: {
        gte: previousStart,
        lte: previousEnd,
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  const previousRevenueAmount = previousRevenue._sum.totalAmount || 0;
  const revenueGrowth =
    previousRevenueAmount > 0
      ? ((totalRevenueAmount - previousRevenueAmount) / previousRevenueAmount) *
        100
      : 0;

  const stats = {
    overview: {
      totalInvoices,
      totalRevenue: totalRevenueAmount,
      averageInvoiceValue,
      paymentRate,
      revenueGrowth,
    },
    invoiceStatus: {
      paid: paidInvoices,
      unpaid: unpaidInvoices,
      overdue: overdueInvoices,
      total: totalInvoices,
    },
    businessMetrics: {
      totalClients,
      totalEmployees,
      totalBranches,
      totalServices,
    },
    recentInvoices,
  };

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { stats },
    "Dashboard statistics retrieved successfully"
  );
});

// Get weekly earnings data for charts
const getWeeklyEarnings = catchAsync(async (req: Request, res: Response) => {
  const { branchId } = req.query;

  // Get last 7 days of data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const whereClause: any = {
    issuedDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (branchId) {
    whereClause.branchId = branchId as string;
  }

  // Get daily earnings for the last 7 days
  const dailyEarnings = await prisma.invoice.groupBy({
    by: ["issuedDate"],
    where: whereClause,
    _sum: {
      totalAmount: true,
    },
    orderBy: {
      issuedDate: "asc",
    },
  });

  // Format data for chart
  const chartData = [];
  const labels = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayEarnings = dailyEarnings.find(
      (d) => d.issuedDate.toISOString().split("T")[0] === dateStr
    );

    chartData.push(dayEarnings?._sum.totalAmount || 0);
    labels.push(date.toLocaleDateString("en-US", { weekday: "short" }));
  }

  // Calculate weekly totals
  const weeklyTotal = chartData.reduce((sum, amount) => sum + amount, 0);
  const weeklyAverage = weeklyTotal / 7;

  // Get previous week for comparison
  const prevStartDate = new Date(startDate);
  const prevEndDate = new Date(endDate);
  prevStartDate.setDate(prevStartDate.getDate() - 7);
  prevEndDate.setDate(prevEndDate.getDate() - 7);

  const previousWeekRevenue = await prisma.invoice.aggregate({
    where: {
      ...whereClause,
      issuedDate: {
        gte: prevStartDate,
        lte: prevEndDate,
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  const previousWeekTotal = previousWeekRevenue._sum.totalAmount || 0;
  const growthPercentage =
    previousWeekTotal > 0
      ? ((weeklyTotal - previousWeekTotal) / previousWeekTotal) * 100
      : 0;

  sendResponse(
    res,
    httpStatus.OK,
    true,
    {
      chartData,
      labels,
      weeklyTotal,
      weeklyAverage,
      growthPercentage,
      previousWeekTotal,
    },
    "Weekly earnings data retrieved successfully"
  );
});

// Get invoice statistics for financial overview
const getInvoiceStats = catchAsync(async (req: Request, res: Response) => {
  const { branchId, period = "month" } = req.query;

  let startDate: Date;
  const endDate = new Date();

  switch (period) {
    case "week":
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "quarter":
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "year":
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
  }

  const whereClause: any = {
    issuedDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (branchId) {
    whereClause.branchId = branchId as string;
  }

  const [
    totalRevenue,
    totalExpenses, // This would need to be calculated from a separate expenses table
    paidInvoices,
    unpaidInvoices,
    overdueInvoices,
    cancelledInvoices,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: whereClause,
      _sum: { totalAmount: true },
    }),

    // For now, we'll use a placeholder for expenses
    // In a real system, you'd have an expenses table
    Promise.resolve({ _sum: { totalAmount: 0 } }),

    prisma.invoice.aggregate({
      where: { ...whereClause, status: "PAID" },
      _sum: { totalAmount: true },
    }),

    prisma.invoice.aggregate({
      where: { ...whereClause, status: "UNPAID" },
      _sum: { totalAmount: true },
    }),

    prisma.invoice.aggregate({
      where: { ...whereClause, status: "OVERDUE" },
      _sum: { totalAmount: true },
    }),

    prisma.invoice.aggregate({
      where: { ...whereClause, status: "CANCELLED" },
      _sum: { totalAmount: true },
    }),
  ]);

  const revenue = totalRevenue._sum.totalAmount || 0;
  const expenses = totalExpenses._sum.totalAmount || 0;
  const profit = revenue - expenses;
  const paidAmount = paidInvoices._sum.totalAmount || 0;
  const unpaidAmount = unpaidInvoices._sum.totalAmount || 0;
  const overdueAmount = overdueInvoices._sum.totalAmount || 0;
  const cancelledAmount = cancelledInvoices._sum.totalAmount || 0;

  sendResponse(
    res,
    httpStatus.OK,
    true,
    {
      revenue,
      expenses,
      profit,
      paidAmount,
      unpaidAmount,
      overdueAmount,
      cancelledAmount,
      period,
    },
    "Invoice statistics retrieved successfully"
  );
});

// Get projects/services overview
const getProjectsOverview = catchAsync(async (req: Request, res: Response) => {
  const { branchId } = req.query;

  const whereClause: any = {};
  if (branchId) {
    whereClause.branchId = branchId as string;
  }

  const [services, clients, recentProjects] = await Promise.all([
    prisma.service.findMany({
      include: {
        _count: {
          select: {
            clients: true,
            invoiceItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),

    prisma.client.findMany({
      where: whereClause,
      include: {
        service: true,
        assignedEmployee: {
          select: {
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            invoices: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),

    // Get recent invoices as "projects"
    prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        employee: {
          select: {
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  // Format projects data
  const projects = recentProjects.map((invoice) => ({
    id: invoice.id,
    title: `Invoice ${invoice.invoiceNumber}`,
    subtitle: invoice.client.name,
    leader: invoice.employee.name || "Unassigned",
    status: getProjectStatusFromInvoice(invoice.status),
    avatar: null, // You can add avatar logic here
    totalAmount: invoice.totalAmount,
    dueDate: invoice.dueDate,
    client: invoice.client,
    branch: invoice.branch,
  }));

  sendResponse(
    res,
    httpStatus.OK,
    true,
    {
      services,
      clients,
      projects,
    },
    "Projects overview retrieved successfully"
  );
});

// Helper function to convert invoice status to project status
const getProjectStatusFromInvoice = (invoiceStatus: string): number => {
  switch (invoiceStatus) {
    case "PAID":
      return 100; // Completed
    case "UNPAID":
      return 25; // Just Started
    case "OVERDUE":
      return 10; // Not Started (overdue)
    case "CANCELLED":
      return 0; // Not Started
    default:
      return 0;
  }
};

export {
  getDashboardStats,
  getWeeklyEarnings,
  getInvoiceStats,
  getProjectsOverview,
};
