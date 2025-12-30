import { Invoice, Prisma, InvoiceStatus } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";

interface InvoiceItemData {
  serviceId: string;
  description: string;
  rate: number;
  discount?: number;
}

interface CreateInvoiceData {
  clientId: string;
  branchId: string;
  employeeId: string; // Required field
  taskId?: string; // Optional: Link to task
  invoiceNumber?: string;
  items: InvoiceItemData[];
  notes?: string;
  thanksMessage: string; // Required field
  paymentTerms?: string;
  taxRate?: number;
  discountAmount?: number;
  paymentMethod?: string;
  bankAccountId?: string;
  // Company Information Fields
  companyName?: string;
  companyTagline?: string;
  companyAddress?: string;
  companyCity?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyLogo?: string;
}

/**
 * Calculate invoice totals including tax and discount
 * @param {InvoiceItemData[]} items
 * @param {number} taxRate - Tax rate as percentage (e.g., 10 for 10%)
 * @param {number} discountAmount - Fixed discount amount
 * @returns {object}
 */
const calculateInvoiceTotals = (
  items: InvoiceItemData[],
  taxRate: number = 0,
  discountAmount: number = 0
) => {
  // Discount is now a flat rate, not percentage
  const subTotalAmount = items.reduce((total, item) => {
    const discount = item.discount || 0; // Flat rate discount
    const lineTotal = item.rate - discount;
    return total + lineTotal;
  }, 0);

  const taxAmount = (subTotalAmount * taxRate) / 100;
  const totalAmount = subTotalAmount + taxAmount - discountAmount;

  return {
    subTotalAmount,
    taxAmount,
    discountAmount,
    totalAmount,
  };
};

/**
 * Generate unique invoice ID for a branch with date
 * @param {string} branchId
 * @returns {Promise<string>}
 */
const generateInvoiceId = async (branchId: string): Promise<string> => {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Branch not found");
  }

  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const monthStr = month.toString().padStart(2, "0");
  const dayStr = day.toString().padStart(2, "0");
  const dateCode = `${year}${monthStr}${dayStr}`;
  const maxRetries = 10; // Prevent infinite loops
  const invoiceIdPrefix = `INV-${branch.branchId}-${dateCode}-`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Get the maximum invoice ID for this branch and date
    // This finds the highest existing number, so we can increment from there
    const invoices = await prisma.invoice.findMany({
      where: {
        branchId: branchId,
        invoiceId: {
          startsWith: invoiceIdPrefix,
        },
      },
      select: {
        invoiceId: true,
      },
      orderBy: {
        invoiceId: "desc",
      },
      take: 1, // Get only the highest one
    });

    let nextSequence = 1; // Default to 1 if no invoices exist

    if (invoices.length > 0 && invoices[0].invoiceId) {
      // Extract sequence number from the highest invoiceId
      // Format: INV-BR-004-20251029-001
      const lastInvoiceId = invoices[0].invoiceId;
      const sequencePart = lastInvoiceId.split("-").pop(); // Get "001"
      if (sequencePart) {
        const lastSequence = parseInt(sequencePart, 10);
        nextSequence = lastSequence + 1;
      }
    }

    // Generate new invoiceId with next sequence
    const sequence = String(nextSequence).padStart(3, "0");
    const invoiceId = `${invoiceIdPrefix}${sequence}`;

    // Check if this invoiceId already exists (handles race conditions)
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceId },
      select: { id: true },
    });

    if (!existingInvoice) {
      // InvoiceId is available
      return invoiceId;
    }

    // If invoiceId exists (race condition), increment and try again
    // On next iteration, it will find the new highest number
  }

  // If we've exhausted retries, use timestamp-based approach as fallback
  const timestamp = Date.now().toString().slice(-6);
  return `${invoiceIdPrefix}${timestamp}`;
};

/**
 * Generate unique invoice number (monthly format: INV-YYYYMM-XXXX)
 * Handles race conditions by checking if invoiceNumber exists and retrying if needed
 * @returns {Promise<string>}
 */
const generateInvoiceNumber = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const maxRetries = 10; // Prevent infinite loops
  const invoiceNumberPrefix = `INV-${year}${month}-`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Get the maximum invoice number for this month
    // This finds the highest existing number, so we can increment from there
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceNumber: {
          startsWith: invoiceNumberPrefix,
        },
      },
      select: {
        invoiceNumber: true,
      },
      orderBy: {
        invoiceNumber: "desc",
      },
      take: 1, // Get only the highest one
    });

    let nextSequence = 1; // Default to 1 if no invoices exist this month

    if (invoices.length > 0 && invoices[0].invoiceNumber) {
      // Extract sequence number from the highest invoiceNumber
      // Format: INV-202510-0001
      const lastInvoiceNumber = invoices[0].invoiceNumber;
      const sequencePart = lastInvoiceNumber.split("-").pop(); // Get "0001"
      if (sequencePart) {
        const lastSequence = parseInt(sequencePart, 10);
        nextSequence = lastSequence + 1;
      }
    }

    // Generate new invoiceNumber with next sequence
    const sequence = String(nextSequence).padStart(4, "0");
    const invoiceNumber = `${invoiceNumberPrefix}${sequence}`;

    // Check if this invoiceNumber already exists (handles race conditions)
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      select: { id: true },
    });

    if (!existingInvoice) {
      // InvoiceNumber is available
      return invoiceNumber;
    }

    // If invoiceNumber exists (race condition), increment and try again
    // On next iteration, it will find the new highest number
  }

  // If we've exhausted retries, use timestamp-based approach as fallback
  const timestamp = Date.now().toString().slice(-6);
  return `${invoiceNumberPrefix}${timestamp}`;
};

/**
 * Calculate individual item total
 * @param {number} rate
 * @param {number} discount - Flat rate discount (not percentage)
 * @returns {number}
 */
const calculateItemTotal = (rate: number, discount: number = 0): number => {
  // Discount is now a flat rate, not percentage
  return rate - discount;
};

/**
 * Create an invoice
 * @param {CreateInvoiceData} invoiceData
 * @returns {Promise<Invoice>}
 */
const createInvoice = async (
  invoiceData: CreateInvoiceData
): Promise<Invoice> => {
  // Check if client exists
  const client = await prisma.client.findUnique({
    where: { id: invoiceData.clientId },
  });

  if (!client) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Client not found");
  }

  // Check if branch exists
  const branch = await prisma.branch.findUnique({
    where: { id: invoiceData.branchId },
  });

  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Branch not found");
  }

  // Check if employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: invoiceData.employeeId },
  });

  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Employee not found");
  }

  // Verify client belongs to the specified branch
  if (client.branchId !== invoiceData.branchId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Client does not belong to the specified branch"
    );
  }

  // Check if invoice number already exists
  if (invoiceData.invoiceNumber) {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: invoiceData.invoiceNumber },
    });

    if (existingInvoice) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invoice number already exists"
      );
    }
  }

  // Validate invoice items and services
  for (const item of invoiceData.items) {
    const service = await prisma.service.findUnique({
      where: { id: item.serviceId },
    });

    if (!service) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Service with ID ${item.serviceId} not found`
      );
    }

    if (item.rate <= 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Rate must be greater than 0");
    }

    if (item.discount && item.discount < 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Discount cannot be negative");
    }
  }

  const taxRate = invoiceData.taxRate || 0;
  const discountAmount = invoiceData.discountAmount || 0;

  const { subTotalAmount, taxAmount, totalAmount } = calculateInvoiceTotals(
    invoiceData.items,
    taxRate,
    discountAmount
  );

  // Generate invoice number and ID with retry logic to handle race conditions
  let invoiceNumber =
    invoiceData.invoiceNumber || (await generateInvoiceNumber());
  let invoiceId = await generateInvoiceId(invoiceData.branchId);
  const maxRetries = 5;
  let lastError: any;
  let invoice;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Create invoice with items in a transaction
      invoice = await prisma.$transaction(async (tx) => {
        const newInvoice = await tx.invoice.create({
          data: {
            clientId: invoiceData.clientId,
            branchId: invoiceData.branchId,
            employeeId: invoiceData.employeeId,
            taskId: invoiceData.taskId,
            invoiceNumber,
            invoiceId,
            subTotalAmount,
            discountAmount,
            taxAmount,
            taxRate,
            totalAmount,
            status: InvoiceStatus.UNPAID,
            notes: invoiceData.notes,
            thanksMessage: invoiceData.thanksMessage,
            paymentTerms: invoiceData.paymentTerms,
            paymentMethod: invoiceData.paymentMethod || "Internet Banking",
            bankAccountId: invoiceData.bankAccountId,
            // Company Information Fields
            companyName: invoiceData.companyName,
            companyTagline: invoiceData.companyTagline,
            companyAddress: invoiceData.companyAddress,
            companyCity: invoiceData.companyCity,
            companyPhone: invoiceData.companyPhone,
            companyEmail: invoiceData.companyEmail,
            companyWebsite: invoiceData.companyWebsite,
            companyLogo: invoiceData.companyLogo,
          },
        });

        // Create invoice items with calculated totals
        const invoiceItems = await Promise.all(
          invoiceData.items.map((item) => {
            const discount = item.discount || 0;
            const total = calculateItemTotal(item.rate, discount);

            return tx.invoiceItem.create({
              data: {
                invoiceId: newInvoice.id,
                serviceId: item.serviceId,
                description: item.description,
                rate: item.rate,
                discount: discount,
                total: total,
              },
            });
          })
        );

        return { ...newInvoice, items: invoiceItems };
      });

      // Success, break out of retry loop
      break;
    } catch (error: any) {
      lastError = error;
      // Check if it's a duplicate key error for invoiceNumber or invoiceId
      if (
        error.code === "P2002" &&
        (error.meta?.target?.includes("invoiceNumber") ||
          error.meta?.target?.includes("invoiceId"))
      ) {
        // Regenerate invoiceNumber and/or invoiceId and retry
        if (attempt < maxRetries - 1) {
          if (error.meta?.target?.includes("invoiceNumber")) {
            invoiceNumber = await generateInvoiceNumber();
          }
          if (error.meta?.target?.includes("invoiceId")) {
            invoiceId = await generateInvoiceId(invoiceData.branchId);
          }
          continue;
        }
      }
      // If it's not a duplicate key error or we've exhausted retries, throw
      throw error;
    }
  }

  if (!invoice) {
    throw (
      lastError ||
      new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create invoice after retries"
      )
    );
  }

  return invoice;
};

/**
 * Query for invoices
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [currentUserRole] - Current user's role for filtering
 * @param {string} [currentUserBranchId] - Current user's branch ID for filtering
 * @returns {Promise<Invoice[]>}
 */
const queryInvoices = async (
  filter: object,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  },
  currentUserRole?: string,
  currentUserBranchId?: string
): Promise<Invoice[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? "desc";

  // Apply branch filtering for managers
  let whereClause = { ...filter };
  if (currentUserRole === "MANAGER" && currentUserBranchId) {
    whereClause = {
      ...whereClause,
      branchId: currentUserBranchId,
    };
  }

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : { createdAt: "desc" },
    include: {
      client: true,
      branch: true,
      employee: true,
      items: {
        include: {
          service: true,
        },
      },
    },
  });

  return invoices;
};

/**
 * Get invoice by id
 * @param {string} id
 * @returns {Promise<Invoice | null>}
 */
const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      branch: true,
      employee: true,
      bankAccount: true,
      items: {
        include: {
          service: true,
        },
      },
    },
  });
};

/**
 * Update invoice by id
 * @param {string} invoiceId
 * @param {Object} updateBody
 * @returns {Promise<Invoice | null>}
 */
const updateInvoiceById = async (
  invoiceId: string,
  updateBody: Prisma.InvoiceUpdateInput
): Promise<Invoice | null> => {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  // Check if new invoice number conflicts
  if (
    updateBody.invoiceNumber &&
    updateBody.invoiceNumber !== invoice.invoiceNumber
  ) {
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: updateBody.invoiceNumber as string,
        id: { not: invoiceId },
      },
    });

    if (existingInvoice) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invoice number already exists"
      );
    }
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: updateBody,
    include: {
      client: true,
      branch: true,
      employee: true,
      items: {
        include: {
          service: true,
        },
      },
    },
  });

  return updatedInvoice;
};

/**
 * Update invoice with items and recalculate totals
 * @param {string} invoiceId
 * @param {Object} updateData
 * @returns {Promise<Invoice | null>}
 */
const updateInvoiceWithItems = async (
  invoiceId: string,
  updateData: any
): Promise<Invoice | null> => {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  const { items, taxRate, discountAmount, ...otherData } = updateData;

  // Validate all services exist if items are provided
  if (items && Array.isArray(items)) {
    for (const item of items) {
      const service = await prisma.service.findUnique({
        where: { id: item.serviceId },
      });

      if (!service) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Service with ID ${item.serviceId} not found`
        );
      }
    }
  }

  // Calculate new totals if items are provided
  let calculatedTotals = {};
  if (items && Array.isArray(items)) {
    const { subTotalAmount, taxAmount, totalAmount } = calculateInvoiceTotals(
      items,
      taxRate || invoice.taxRate,
      discountAmount || invoice.discountAmount
    );

    calculatedTotals = {
      subTotalAmount,
      taxAmount,
      totalAmount,
      taxRate: taxRate || invoice.taxRate,
      discountAmount: discountAmount || invoice.discountAmount,
    };
  }

  // Update invoice and items in transaction
  const updatedInvoice = await prisma.$transaction(async (tx) => {
    // Update invoice data
    const invoiceUpdateData = {
      ...otherData,
      ...calculatedTotals,
    };

    // Transform ID fields to nested connect objects
    if (otherData.clientId) {
      invoiceUpdateData.client = { connect: { id: otherData.clientId } };
      delete invoiceUpdateData.clientId;
    }

    if (otherData.branchId) {
      invoiceUpdateData.branch = { connect: { id: otherData.branchId } };
      delete invoiceUpdateData.branchId;
    }

    if (otherData.employeeId) {
      invoiceUpdateData.employee = { connect: { id: otherData.employeeId } };
      delete invoiceUpdateData.employeeId;
    }

    if (otherData.bankAccountId) {
      invoiceUpdateData.bankAccount = {
        connect: { id: otherData.bankAccountId },
      };
      delete invoiceUpdateData.bankAccountId;
    }

    // Update invoice
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: invoiceUpdateData,
    });

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId },
      });

      // Create new items
      await Promise.all(
        items.map((item) => {
          const discount = item.discount || 0;
          const total = calculateItemTotal(item.rate, discount);

          return tx.invoiceItem.create({
            data: {
              invoiceId,
              serviceId: item.serviceId,
              description: item.description,
              rate: item.rate,
              discount: discount,
              total: total,
            },
          });
        })
      );
    }

    // Return updated invoice with relationships
    return tx.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        branch: true,
        employee: true,
        items: {
          include: {
            service: true,
          },
        },
      },
    });
  });

  return updatedInvoice;
};

/**
 * Delete invoice by id
 * @param {string} invoiceId
 * @returns {Promise<Invoice>}
 */
const deleteInvoiceById = async (invoiceId: string): Promise<Invoice> => {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  // Check if invoice is paid
  if (invoice.status === InvoiceStatus.PAID) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Cannot delete a paid invoice");
  }

  await prisma.invoice.delete({ where: { id: invoiceId } });
  return invoice;
};

/**
 * Update invoice status
 * @param {string} invoiceId
 * @param {InvoiceStatus} status
 * @returns {Promise<Invoice | null>}
 */
const updateInvoiceStatus = async (
  invoiceId: string,
  status: InvoiceStatus
): Promise<Invoice | null> => {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
    include: {
      client: true,
      branch: true,
      employee: true,
      items: {
        include: {
          service: true,
        },
      },
    },
  });

  return updatedInvoice;
};

/**
 * Create an invoice from a task
 * @param {string} taskId
 * @param {Object} invoiceOptions
 * @returns {Promise<Invoice>}
 */
const createInvoiceFromTask = async (
  taskId: string,
  invoiceOptions: {
    notes?: string;
    thanksMessage?: string;
    paymentTerms?: string;
    taxRate?: number;
    discountAmount?: number;
    paymentMethod?: string;
    bankAccountId?: string;
  }
): Promise<Invoice> => {
  // Use a transaction to ensure atomicity and prevent race conditions
  return await prisma.$transaction(async (tx) => {
    // Get task with related data inside the transaction
    const task = await tx.task.findUnique({
      where: { id: taskId },
      include: {
        client: {
          include: {
            branch: true,
          },
        },
        service: true,
        assignedEmployee: true,
      },
    });

    if (!task) {
      throw new ApiError(httpStatus.NOT_FOUND, "Task not found");
    }

    // Re-verify task is still completed inside the transaction
    if (task.status !== "COMPLETED") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Cannot create invoice for incomplete task"
      );
    }

    // Check if invoice already exists for this task inside the transaction
    const existingInvoice = await tx.invoice.findFirst({
      where: { taskId },
    });

    if (existingInvoice) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invoice already exists for this task"
      );
    }

    // Create invoice data from task
    const invoiceData: CreateInvoiceData = {
      clientId: task.clientId,
      branchId: task.client.branchId,
      employeeId: task.assignedEmployeeId,
      taskId: task.id,
      items: [
        {
          serviceId: task.serviceId,
          description: `${task.service.name} - ${task.title}`,
          rate: task.service.price,
          discount: 0,
        },
      ],
      notes:
        invoiceOptions.notes || task.notes || `Invoice for task: ${task.title}`,
      thanksMessage:
        invoiceOptions.thanksMessage || "Thank you for your business!",
      paymentTerms: invoiceOptions.paymentTerms,
      taxRate: invoiceOptions.taxRate,
      discountAmount: invoiceOptions.discountAmount,
      paymentMethod: invoiceOptions.paymentMethod,
      bankAccountId: invoiceOptions.bankAccountId,
    };

    // Note: createInvoice handles its own nested transaction/retry logic if needed,
    // but here we are already in a transaction. Prisma supports nested transactions
    // by using the parent transaction if one exists.
    return createInvoice(invoiceData);
  });
};

// Get all invoices with pagination
const getInvoicesWithPagination = async (
  options: {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortType: "asc" | "desc";
    status?: string;
    branchId?: string;
  },
  currentUserRole?: string,
  currentUserBranchId?: string
) => {
  const { page, limit, search, sortBy, sortType, status, branchId } = options;
  const skip = (page - 1) * limit;

  // Build where clause for search
  let whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" as const } },
      { client: { name: { contains: search, mode: "insensitive" as const } } },
      { client: { email: { contains: search, mode: "insensitive" as const } } },
      {
        employee: { name: { contains: search, mode: "insensitive" as const } },
      },
      { branch: { name: { contains: search, mode: "insensitive" as const } } },
    ];
  }

  // Apply status filtering
  if (status) {
    whereClause.status = status;
  }

  // Apply branch filtering
  if (branchId) {
    whereClause.branchId = branchId;
  } else if (currentUserRole === "MANAGER" && currentUserBranchId) {
    whereClause.branchId = currentUserBranchId;
  }

  // Build orderBy clause
  const orderByClause = {
    [sortBy]: sortType,
  };

  // Get total count for pagination
  const total = await prisma.invoice.count({ where: whereClause });

  // Get paginated data
  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
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
    data: invoices,
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

// Get comprehensive revenue report data
const getRevenueReportData = async (
  filters: {
    branchId?: string;
    clientId?: string;
    employeeId?: string;
    status?: InvoiceStatus;
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
    whereClause.branchId = currentUserBranchId;
  } else if (filters.branchId) {
    whereClause.branchId = filters.branchId;
  }

  if (filters.clientId) {
    whereClause.clientId = filters.clientId;
  }

  if (filters.employeeId) {
    whereClause.employeeId = filters.employeeId;
  }

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    whereClause.issuedDate = {};
    if (filters.startDate) {
      whereClause.issuedDate.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereClause.issuedDate.lte = filters.endDate;
    }
  }

  // Apply search filter
  if (filters.search) {
    whereClause.OR = [
      { invoiceNumber: { contains: filters.search, mode: "insensitive" as const } },
      { invoiceId: { contains: filters.search, mode: "insensitive" as const } },
      { client: { name: { contains: filters.search, mode: "insensitive" as const } } },
      { client: { email: { contains: filters.search, mode: "insensitive" as const } } },
      { employee: { name: { contains: filters.search, mode: "insensitive" as const } } },
      { branch: { name: { contains: filters.search, mode: "insensitive" as const } } },
    ];
  }

  // Get invoices with all related data
  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      bankAccount: {
        select: {
          id: true,
          bankName: true,
          accountNumber: true,
          bankIban: true,
          accountName: true,
        },
      },
      items: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
    },
    orderBy: { issuedDate: "desc" },
  });

  // Calculate summary statistics
  const summary = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    ),
    subTotalAmount: invoices.reduce(
      (sum, inv) => sum + Number(inv.subTotalAmount),
      0
    ),
    taxAmount: invoices.reduce((sum, inv) => sum + Number(inv.taxAmount), 0),
    discountAmount: invoices.reduce(
      (sum, inv) => sum + Number(inv.discountAmount),
      0
    ),
    paidAmount: invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
    unpaidAmount: invoices
      .filter((inv) => inv.status === "UNPAID")
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
    overdueAmount: invoices
      .filter((inv) => inv.status === "OVERDUE")
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
    statusBreakdown: {
      PAID: invoices.filter((inv) => inv.status === "PAID").length,
      UNPAID: invoices.filter((inv) => inv.status === "UNPAID").length,
      OVERDUE: invoices.filter((inv) => inv.status === "OVERDUE").length,
      CANCELLED: invoices.filter((inv) => inv.status === "CANCELLED").length,
    },
  };

  return {
    invoices,
    summary,
    filters,
    generatedAt: new Date(),
  };
};

// Generate Excel report
const generateRevenueReportExcel = async (reportData: any, format: string) => {
  const XLSX = require("xlsx");

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["Revenue Report Summary"],
    [""],
    ["Generated At:", reportData.generatedAt.toLocaleString()],
    [""],
    ["Total Invoices:", reportData.summary.totalInvoices],
    ["Total Amount:", `€${reportData.summary.totalAmount.toFixed(2)}`],
    ["Subtotal Amount:", `€${reportData.summary.subTotalAmount.toFixed(2)}`],
    ["Tax Amount:", `€${reportData.summary.taxAmount.toFixed(2)}`],
    ["Discount Amount:", `€${reportData.summary.discountAmount.toFixed(2)}`],
    [""],
    ["Status Breakdown:"],
    ["Paid Amount:", `€${reportData.summary.paidAmount.toFixed(2)}`],
    ["Unpaid Amount:", `€${reportData.summary.unpaidAmount.toFixed(2)}`],
    ["Overdue Amount:", `€${reportData.summary.overdueAmount.toFixed(2)}`],
    [""],
    ["Invoice Count by Status:"],
    ["Paid:", reportData.summary.statusBreakdown.PAID],
    ["Unpaid:", reportData.summary.statusBreakdown.UNPAID],
    ["Overdue:", reportData.summary.statusBreakdown.OVERDUE],
    ["Cancelled:", reportData.summary.statusBreakdown.CANCELLED],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Detailed invoices sheet
  const invoiceData = [
    [
      "Invoice Number",
      "Invoice ID",
      "Client Name",
      "Client Email",
      "Client Phone",
      "Branch",
      "Employee Name",
      "Employee Email",
      "Status",
      "Issue Date",
      "Created At",
      "Payment Method",
      "Bank Account",
      "Bank IBAN",
      "Payment Terms",
      "Tax Rate (%)",
      "Subtotal",
      "Tax Amount",
      "Discount Amount",
      "Total Amount",
      "Services",
      "Service Categories",
      "Items Count",
      "Notes",
      "Thanks Message",
    ],
  ];

  reportData.invoices.forEach((invoice: any) => {
    const services = invoice.items
      .map((item: any) => `${item.service.name} (€${item.rate})`)
      .join("; ");
    
    const serviceCategories = invoice.items
      .map((item: any) => item.service.category)
      .filter((cat: string, index: number, arr: string[]) => arr.indexOf(cat) === index)
      .join("; ");

    invoiceData.push([
      invoice.invoiceNumber || "",
      invoice.invoiceId || "",
      invoice.client?.name || "",
      invoice.client?.email || "",
      invoice.client?.phone || "",
      invoice.branch?.name || "",
      invoice.employee?.name || "",
      invoice.employee?.email || "",
      invoice.status || "",
      invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : "",
      invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : "",
      invoice.paymentMethod || "",
      invoice.bankAccount?.bankName ? `${invoice.bankAccount.bankName} - ${invoice.bankAccount.accountNumber || ""}` : "",
      invoice.bankAccount?.bankIban || "",
      invoice.paymentTerms || "",
      invoice.taxRate ? `${Number(invoice.taxRate).toFixed(2)}%` : "0%",
      `€${Number(invoice.subTotalAmount || 0).toFixed(2)}`,
      `€${Number(invoice.taxAmount || 0).toFixed(2)}`,
      `€${Number(invoice.discountAmount || 0).toFixed(2)}`,
      `€${Number(invoice.totalAmount || 0).toFixed(2)}`,
      services || "",
      serviceCategories || "",
      invoice.items?.length || 0,
      invoice.notes || "",
      invoice.thanksMessage || "",
    ]);
  });

  const invoiceSheet = XLSX.utils.aoa_to_sheet(invoiceData);
  XLSX.utils.book_append_sheet(workbook, invoiceSheet, "Invoices");

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
};

export default {
  createInvoice,
  createInvoiceFromTask,
  queryInvoices,
  getInvoicesWithPagination,
  getInvoiceById,
  updateInvoiceById,
  updateInvoiceWithItems,
  deleteInvoiceById,
  updateInvoiceStatus,
  generateInvoiceNumber,
  calculateItemTotal,
  calculateInvoiceTotals,
  getRevenueReportData,
  generateRevenueReportExcel,
};
