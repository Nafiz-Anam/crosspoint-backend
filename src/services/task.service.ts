import { Task, TaskStatus, Prisma, Role } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";

/**
 * Generate unique task ID for a branch
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

  // Get count of tasks for clients in this branch
  const taskCount = await prisma.task.count({
    where: {
      client: {
        branchId: branchId,
      },
    },
  });

  const currentYear = new Date().getFullYear();
  const sequence = String(taskCount + 1).padStart(3, "0");
  return `TSK-${branch.branchId}-${currentYear}-${sequence}`;
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
 * @param {number} estimatedHours
 * @param {string} notes
 * @returns {Promise<Task>}
 */
const createTask = async (
  clientId: string,
  serviceId: string,
  assignedEmployeeId: string,
  description: string,
  status: TaskStatus,
  dueDate: Date,
  startDate: Date,
  estimatedHours: number,
  notes: string
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

  // Generate task ID
  const taskId = await generateTaskId(client.branchId);

  // Auto-generate title based on service and client
  const generatedTitle = `${service.name} for ${client.name}`;

  // Create task
  const task = await prisma.task.create({
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
      estimatedHours,
      notes,
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

  return task;
};

/**
 * Query for tasks with filtering and role-based access
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} currentUserId - Current user's ID for filtering
 * @param {string} currentUserRole - Current user's role
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
  currentUserRole: string
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
 * @returns {Promise<Object>} Task statistics
 */
const getTaskStatistics = async (
  userId: string,
  userRole: Role
): Promise<{ pending: number; completed: number; cancelled: number }> => {
  let filter = {};

  // For employees, only show tasks assigned to them
  if (userRole === Role.EMPLOYEE) {
    filter = { assignedEmployeeId: userId };
  } else if (userRole === Role.MANAGER) {
    // For managers, show tasks from their branch
    const employee = await prisma.employee.findUnique({
      where: { id: userId },
      select: { branchId: true },
    });
    if (employee?.branchId) {
      filter = {
        client: {
          branchId: employee.branchId,
        },
      };
    }
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

export {
  createTask,
  queryTasks,
  getTaskById,
  updateTaskById,
  deleteTaskById,
  getTasksByClientId,
  getTaskStatistics,
};
