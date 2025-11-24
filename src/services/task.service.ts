import { Task, TaskStatus, Prisma, Role } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";

/**
 * Generate unique task ID for a branch
 * Handles race conditions by checking if taskId exists and retrying if needed
 * @param {string} branchId
 * @returns {Promise<string>}
 */
const generateTaskId = async (branchId: string): Promise<string> => {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Branch not found");
  }

  const currentYear = new Date().getFullYear();
  const maxRetries = 10; // Prevent infinite loops
  const taskIdPrefix = `TSK-${branch.branchId}-${currentYear}-`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Get the maximum sequence number for tasks in this branch for the current year
    // This finds the highest existing number, so we can increment from there
    const tasks = await prisma.task.findMany({
      where: {
        client: {
          branchId: branchId,
        },
        taskId: {
          startsWith: taskIdPrefix,
        },
      },
      select: {
        taskId: true,
      },
      orderBy: {
        taskId: "desc",
      },
      take: 1, // Get only the highest one
    });

    let nextSequence = 1; // Default to 1 if no tasks exist

    if (tasks.length > 0 && tasks[0].taskId) {
      // Extract sequence number from the highest taskId
      // Format: TSK-BR-004-2025-001
      const lastTaskId = tasks[0].taskId;
      const sequencePart = lastTaskId.split("-").pop(); // Get "001"
      if (sequencePart) {
        const lastSequence = parseInt(sequencePart, 10);
        nextSequence = lastSequence + 1;
      }
    }

    // Generate new taskId with next sequence
    const sequence = String(nextSequence).padStart(3, "0");
    const taskId = `${taskIdPrefix}${sequence}`;

    // Check if this taskId already exists (handles race conditions)
    const existingTask = await prisma.task.findUnique({
      where: { taskId },
      select: { id: true },
    });

    if (!existingTask) {
      // TaskId is available
      return taskId;
    }

    // If taskId exists (race condition), increment and try again
    // On next iteration, it will find the new highest number
  }

  // If we've exhausted retries, use timestamp-based approach as fallback
  const timestamp = Date.now().toString().slice(-6);
  return `${taskIdPrefix}${timestamp}`;
};

/**
 * Create a task
 * @param {string} clientId
 * @param {string} serviceId
 * @param {string} assignedEmployeeId
 * @param {string} description
 * @param {TaskStatus} status
 * @param {Date} dueDate
 * @param {Date} startDate
 * @returns {Promise<Task>}
 */
const createTask = async (
  clientId: string,
  serviceId: string,
  assignedEmployeeId: string,
  description: string,
  status: TaskStatus,
  dueDate: Date,
  startDate: Date
): Promise<Task> => {
  // Verify client exists and get branch info
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { branch: true },
  });

  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, "Client not found");
  }

  // Verify service exists
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }

  // Verify assigned employee exists and is active
  const employee = await prisma.employee.findUnique({
    where: { id: assignedEmployeeId },
  });

  if (!employee || !employee.isActive) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found or inactive");
  }

  // Auto-generate title based on service and client
  const generatedTitle = `${service.name} for ${client.name}`;

  // Create task with retry logic to handle race conditions
  let task;
  let taskId = await generateTaskId(client.branchId);
  const maxRetries = 5;
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      task = await prisma.task.create({
        data: {
          taskId,
          title: generatedTitle,
          description,
          clientId,
          serviceId,
          assignedEmployeeId,
          status,
          dueDate,
          startDate,
        },
        include: {
          client: {
            include: {
              branch: true,
            },
          },
          service: true,
          assignedEmployee: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true,
              role: true,
            },
          },
        },
      });
      // Success, break out of retry loop
      break;
    } catch (error: any) {
      lastError = error;
      // Check if it's a duplicate key error for taskId
      if (error.code === "P2002" && error.meta?.target?.includes("taskId")) {
        // Regenerate taskId and retry
        if (attempt < maxRetries - 1) {
          taskId = await generateTaskId(client.branchId);
          continue;
        }
      }
      // If it's not a duplicate key error or we've exhausted retries, throw
      throw error;
    }
  }

  if (!task) {
    throw (
      lastError ||
      new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create task after retries"
      )
    );
  }

  return task;
};

/**
 * Query for tasks with filtering and role-based access
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} currentUserId - Current user's ID for filtering
 * @param {string} currentUserRole - Current user's role
 * @param {string} currentUserBranchId - Current user's branch ID for filtering
 * @returns {Promise<Task[]>}
 */
const queryTasks = async (
  filter: any,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
  currentUserId: string,
  currentUserRole: string,
  currentUserBranchId?: string
): Promise<{
  results: Task[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}> => {
  const {
    limit = 10,
    page = 1,
    sortBy = "createdAt",
    sortType = "desc",
  } = options;
  const skip = (page - 1) * limit;

  // Apply role-based filtering
  let whereClause = { ...filter };

  // If user is EMPLOYEE role, only show tasks assigned to them
  if (currentUserRole === "EMPLOYEE") {
    whereClause.assignedEmployeeId = currentUserId;
  }

  // If user is MANAGER role, only show tasks from their branch
  if (currentUserRole === "MANAGER" && currentUserBranchId) {
    whereClause.client = {
      ...whereClause.client,
      branchId: currentUserBranchId,
    };
  }

  const [tasks, totalResults] = await Promise.all([
    prisma.task.findMany({
      where: whereClause,
      include: {
        client: {
          include: {
            branch: true,
          },
        },
        service: true,
        assignedEmployee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            role: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceId: true,
            status: true,
            totalAmount: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortType,
      },
    }),
    prisma.task.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: tasks,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Get task by id
 * @param {string} id
 * @param {string} currentUserId - Current user's ID for filtering
 * @param {string} currentUserRole - Current user's role
 * @returns {Promise<Task>}
 */
const getTaskById = async (
  id: string,
  currentUserId: string,
  currentUserRole: string
): Promise<Task | null> => {
  let whereClause: any = { id };

  // If user is EMPLOYEE role, only show tasks assigned to them
  if (currentUserRole === "EMPLOYEE") {
    whereClause.assignedEmployeeId = currentUserId;
  }

  const task = await prisma.task.findFirst({
    where: whereClause,
    include: {
      client: {
        include: {
          branch: true,
        },
      },
      service: true,
      assignedEmployee: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          role: true,
        },
      },
      invoices: {
        select: {
          id: true,
          invoiceId: true,
          status: true,
          totalAmount: true,
          issuedDate: true,
        },
      },
    },
  });

  return task;
};

/**
 * Update task by id
 * @param {string} taskId
 * @param {Object} updateBody
 * @param {string} currentUserId - Current user's ID for filtering
 * @param {string} currentUserRole - Current user's role
 * @returns {Promise<Task>}
 */
const updateTaskById = async (
  taskId: string,
  updateBody: Partial<Task>,
  currentUserId: string,
  currentUserRole: string
): Promise<Task> => {
  const task = await getTaskById(taskId, currentUserId, currentUserRole);

  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, "Task not found");
  }

  // If updating status to COMPLETED, set completedDate
  if (
    updateBody.status === TaskStatus.COMPLETED &&
    task.status !== TaskStatus.COMPLETED
  ) {
    updateBody.completedDate = new Date();
  }

  // If changing from COMPLETED to another status, clear completedDate
  if (
    updateBody.status &&
    updateBody.status !== TaskStatus.COMPLETED &&
    task.status === TaskStatus.COMPLETED
  ) {
    updateBody.completedDate = null;
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateBody,
    include: {
      client: {
        include: {
          branch: true,
        },
      },
      service: true,
      assignedEmployee: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          role: true,
        },
      },
      invoices: {
        select: {
          id: true,
          invoiceId: true,
          status: true,
          totalAmount: true,
        },
      },
    },
  });

  return updatedTask;
};

/**
 * Delete task by id
 * @param {string} taskId
 * @param {string} currentUserId - Current user's ID for filtering
 * @param {string} currentUserRole - Current user's role
 * @returns {Promise<Task>}
 */
const deleteTaskById = async (
  taskId: string,
  currentUserId: string,
  currentUserRole: string
): Promise<Task> => {
  const task = await getTaskById(taskId, currentUserId, currentUserRole);

  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, "Task not found");
  }

  // Check if task has associated invoices
  const invoiceCount = await prisma.invoice.count({
    where: { taskId },
  });

  if (invoiceCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete task with associated invoices"
    );
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  return task;
};

/**
 * Get tasks by client ID
 * @param {string} clientId
 * @param {string} currentUserId - Current user's ID for filtering
 * @param {string} currentUserRole - Current user's role
 * @returns {Promise<Task[]>}
 */
/**
 * Get task statistics based on user role and ID
 * @param {string} userId - Current user's ID
 * @param {Role} userRole - Current user's role
 * @param {string} userBranchId - Current user's branch ID
 * @returns {Promise<Object>} Task statistics
 */
const getTaskStatistics = async (
  userId: string,
  userRole: Role,
  userBranchId?: string
): Promise<{ pending: number; completed: number; cancelled: number }> => {
  let filter = {};

  // For employees, only show tasks assigned to them
  if (userRole === Role.EMPLOYEE) {
    filter = { assignedEmployeeId: userId };
  } else if (userRole === Role.MANAGER && userBranchId) {
    // For managers, show tasks from their branch
    filter = {
      client: {
        branchId: userBranchId,
      },
    };
  }
  // For admin and HR, show all tasks (no additional filter)

  const taskStats = await prisma.task.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
    where: filter,
  });

  // Convert the results into the expected format
  const stats = {
    pending: 0,
    completed: 0,
    cancelled: 0,
  };

  taskStats.forEach((stat) => {
    if (stat.status === TaskStatus.PENDING) {
      stats.pending = stat._count._all;
    } else if (stat.status === TaskStatus.COMPLETED) {
      stats.completed = stat._count._all;
    } else if (stat.status === TaskStatus.CANCELLED) {
      stats.cancelled = stat._count._all;
    }
  });

  return stats;
};

const getTasksByClientId = async (
  clientId: string,
  currentUserId: string,
  currentUserRole: string
): Promise<Task[]> => {
  let whereClause: any = { clientId };

  // If user is EMPLOYEE role, only show tasks assigned to them
  if (currentUserRole === "EMPLOYEE") {
    whereClause.assignedEmployeeId = currentUserId;
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      client: true,
      service: true,
      assignedEmployee: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return tasks;
};

// Get all tasks with pagination
const getTasksWithPagination = async (
  options: {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortType: "asc" | "desc";
    status?: string;
    assignedEmployeeId?: string;
    branchId?: string;
  },
  currentUserId: string,
  currentUserRole: string,
  currentUserBranchId?: string
) => {
  const {
    page,
    limit,
    search,
    sortBy,
    sortType,
    status,
    assignedEmployeeId,
    branchId,
  } = options;
  const skip = (page - 1) * limit;

  // Build where clause for search
  let whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
      { client: { name: { contains: search, mode: "insensitive" as const } } },
      { service: { name: { contains: search, mode: "insensitive" as const } } },
      {
        assignedEmployee: {
          name: { contains: search, mode: "insensitive" as const },
        },
      },
    ];
  }

  // Apply status filtering
  if (status) {
    whereClause.status = status;
  }

  // Apply assigned employee filtering
  if (assignedEmployeeId) {
    whereClause.assignedEmployeeId = assignedEmployeeId;
  }

  // Apply branch filtering
  if (branchId) {
    whereClause.client = {
      ...whereClause.client,
      branchId: branchId,
    };
  }

  // Apply role-based filtering
  if (currentUserRole === "EMPLOYEE") {
    whereClause.assignedEmployeeId = currentUserId;
  }

  if (currentUserRole === "MANAGER" && currentUserBranchId) {
    whereClause.client = {
      ...whereClause.client,
      branchId: currentUserBranchId,
    };
  }

  // Build orderBy clause
  const orderByClause = {
    [sortBy]: sortType,
  };

  // Get total count for pagination
  const total = await prisma.task.count({ where: whereClause });

  // Get paginated data
  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      client: {
        include: {
          branch: true,
        },
      },
      service: true,
      assignedEmployee: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          role: true,
        },
      },
      invoices: {
        select: {
          id: true,
          invoiceId: true,
          status: true,
          totalAmount: true,
        },
      },
    },
    orderBy: orderByClause,
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: tasks,
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

/**
 * Get task report data with summary and detailed tasks
 * @param {Object} filters - Filter options
 * @param {string} currentUserRole - Current user's role
 * @param {string} currentUserBranchId - Current user's branch ID
 * @returns {Promise<Object>}
 */
const getTaskReportData = async (
  filters: {
    branchId?: string;
    clientId?: string;
    employeeId?: string;
    status?: TaskStatus;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  },
  currentUserRole?: string,
  currentUserBranchId?: string
) => {
  // Build where clause
  let whereClause: any = {};

  // Apply branch filtering for managers
  if (currentUserRole === "MANAGER" && currentUserBranchId) {
    whereClause.client = {
      ...whereClause.client,
      branchId: currentUserBranchId,
    };
  } else if (filters.branchId) {
    whereClause.client = {
      ...whereClause.client,
      branchId: filters.branchId,
    };
  }

  if (filters.clientId) {
    whereClause.clientId = filters.clientId;
  }

  if (filters.employeeId) {
    whereClause.assignedEmployeeId = filters.employeeId;
  }

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    whereClause.startDate = {};
    if (filters.startDate) {
      whereClause.startDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereClause.startDate.lte = filters.endDate;
    }
  }

  // Apply search filter
  if (filters.search) {
    whereClause.OR = [
      { title: { contains: filters.search, mode: "insensitive" as const } },
      { description: { contains: filters.search, mode: "insensitive" as const } },
      { client: { name: { contains: filters.search, mode: "insensitive" as const } } },
      { service: { name: { contains: filters.search, mode: "insensitive" as const } } },
      {
        assignedEmployee: {
          name: { contains: filters.search, mode: "insensitive" as const },
        },
      },
    ];
  }

  // Get tasks with all related data
  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          branch: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      },
      assignedEmployee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
        },
      },
      invoices: {
        select: {
          id: true,
          invoiceId: true,
          status: true,
          totalAmount: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate summary statistics
  const summary = {
    totalTasks: tasks.length,
    pendingTasks: tasks.filter((task) => task.status === "PENDING").length,
    inProgressTasks: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    completedTasks: tasks.filter((task) => task.status === "COMPLETED").length,
    cancelledTasks: tasks.filter((task) => task.status === "CANCELLED").length,
    onHoldTasks: tasks.filter((task) => task.status === "ON_HOLD").length,
    tasksWithInvoices: tasks.filter((task) => task.invoices && task.invoices.length > 0).length,
    totalInvoiceAmount: tasks.reduce((sum, task) => {
      const invoiceTotal = task.invoices?.reduce((invSum, inv) => invSum + Number(inv.totalAmount || 0), 0) || 0;
      return sum + invoiceTotal;
    }, 0),
    statusBreakdown: {
      PENDING: tasks.filter((task) => task.status === "PENDING").length,
      IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      COMPLETED: tasks.filter((task) => task.status === "COMPLETED").length,
      CANCELLED: tasks.filter((task) => task.status === "CANCELLED").length,
      ON_HOLD: tasks.filter((task) => task.status === "ON_HOLD").length,
    },
  };

  return {
    tasks,
    summary,
    filters,
    generatedAt: new Date(),
  };
};

/**
 * Generate Excel report for tasks
 * @param {Object} reportData - Report data from getTaskReportData
 * @param {string} format - Format type (excel or csv)
 * @returns {Promise<Buffer>}
 */
const generateTaskReportExcel = async (reportData: any, format: string) => {
  const XLSX = require("xlsx");

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["Task Management Report Summary"],
    [""],
    ["Generated At:", reportData.generatedAt.toLocaleString()],
    [""],
    ["Total Tasks:", reportData.summary.totalTasks],
    [""],
    ["Status Breakdown:"],
    ["Pending:", reportData.summary.statusBreakdown.PENDING],
    ["In Progress:", reportData.summary.statusBreakdown.IN_PROGRESS],
    ["Completed:", reportData.summary.statusBreakdown.COMPLETED],
    ["Cancelled:", reportData.summary.statusBreakdown.CANCELLED],
    ["On Hold:", reportData.summary.statusBreakdown.ON_HOLD],
    [""],
    ["Additional Statistics:"],
    ["Tasks with Invoices:", reportData.summary.tasksWithInvoices],
    ["Total Invoice Amount:", `€${reportData.summary.totalInvoiceAmount.toFixed(2)}`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Detailed tasks sheet
  const taskData = [
    [
      "Task ID",
      "Title",
      "Description",
      "Client Name",
      "Client Email",
      "Branch",
      "Service",
      "Service Category",
      "Service Price",
      "Assigned Employee",
      "Status",
      "Start Date",
      "Due Date",
      "Created At",
      "Invoices Count",
      "Total Invoice Amount",
    ],
  ];

  reportData.tasks.forEach((task: any) => {
    const invoiceCount = task.invoices?.length || 0;
    const invoiceTotal = task.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || 0), 0) || 0;

    taskData.push([
      task.taskId || task.id,
      task.title || "",
      task.description || "",
      task.client?.name || "",
      task.client?.email || "",
      task.client?.branch?.name || "",
      task.service?.name || "",
      task.service?.category || "",
      task.service?.price ? `€${Number(task.service.price).toFixed(2)}` : "",
      task.assignedEmployee?.name || "",
      task.status || "",
      task.startDate ? new Date(task.startDate).toLocaleDateString() : "",
      task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "",
      task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "",
      invoiceCount,
      `€${invoiceTotal.toFixed(2)}`,
    ]);
  });

  const taskSheet = XLSX.utils.aoa_to_sheet(taskData);
  XLSX.utils.book_append_sheet(workbook, taskSheet, "Tasks");

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
};

export {
  createTask,
  queryTasks,
  getTasksWithPagination,
  getTaskById,
  updateTaskById,
  deleteTaskById,
  getTasksByClientId,
  getTaskStatistics,
  getTaskReportData,
  generateTaskReportExcel,
};
