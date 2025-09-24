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
  dueDate: Date;
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
  const subTotalAmount = items.reduce((total, item) => {
    const discountPercent = item.discount || 0;
    const discountAmount = (item.rate * discountPercent) / 100;
    const lineTotal = item.rate - discountAmount;
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

  const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

  const count = await prisma.invoice.count({
    where: {
      branchId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const monthStr = month.toString().padStart(2, "0");
  const dayStr = day.toString().padStart(2, "0");
  const dateCode = `${year}${monthStr}${dayStr}`;
  const sequence = String(count + 1).padStart(3, "0");
  return `INV-${branch.branchId}-${dateCode}-${sequence}`;
};

/**
 * Generate unique invoice number
 * @returns {Promise<string>}
 */
const generateInvoiceNumber = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const startOfMonth = new Date(year, date.getMonth(), 1);
  const endOfMonth = new Date(year, date.getMonth() + 1, 0);

  const count = await prisma.invoice.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `INV-${year}${month}-${sequence}`;
};

/**
 * Calculate individual item total
 * @param {number} rate
 * @param {number} discount
 * @returns {number}
 */
const calculateItemTotal = (rate: number, discount: number = 0): number => {
  const discountAmount = (rate * discount) / 100;
  return rate - discountAmount;
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

  const invoiceNumber =
    invoiceData.invoiceNumber || (await generateInvoiceNumber());
  const invoiceId = await generateInvoiceId(invoiceData.branchId);

  // Create invoice with items in a transaction
  const invoice = await prisma.$transaction(async (tx) => {
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
        dueDate: invoiceData.dueDate,
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

  return invoice;
};

/**
 * Query for invoices
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @returns {Promise<Invoice[]>}
 */
const queryInvoices = async (
  filter: object,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  }
): Promise<Invoice[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? "desc";

  const invoices = await prisma.invoice.findMany({
    where: filter,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
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
    dueDate: Date;
    notes?: string;
    thanksMessage?: string;
    paymentTerms?: string;
    taxRate?: number;
    discountAmount?: number;
    paymentMethod?: string;
    bankAccountId?: string;
  }
): Promise<Invoice> => {
  // Get task with related data
  const task = await prisma.task.findUnique({
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

  // Check if task is completed
  if (task.status !== "COMPLETED") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot create invoice for incomplete task"
    );
  }

  // Check if invoice already exists for this task
  const existingInvoice = await prisma.invoice.findFirst({
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
    dueDate: invoiceOptions.dueDate,
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

  return createInvoice(invoiceData);
};

export default {
  createInvoice,
  createInvoiceFromTask,
  queryInvoices,
  getInvoiceById,
  updateInvoiceById,
  updateInvoiceWithItems,
  deleteInvoiceById,
  updateInvoiceStatus,
  generateInvoiceNumber,
  calculateItemTotal,
  calculateInvoiceTotals,
};
