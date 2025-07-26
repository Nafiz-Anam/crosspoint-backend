import { Invoice, InvoiceItem, Prisma, InvoiceStatus } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";

interface InvoiceItemData {
  serviceId: string;
  quantity: number;
  price: number;
}

interface CreateInvoiceData {
  clientId: string;
  branchId: string;
  invoiceNumber: string;
  dueDate: Date;
  items: InvoiceItemData[];
  notes?: string;
}

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
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();

  // Get count of invoices for this branch on this specific date
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

  // Get count of invoices for this month
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
 * Calculate total amount from invoice items
 * @param {InvoiceItemData[]} items
 * @returns {number}
 */
const calculateTotalAmount = (items: InvoiceItemData[]): number => {
  return items.reduce((total, item) => total + item.quantity * item.price, 0);
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

  // Validate invoice items
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
  }

  const totalAmount = calculateTotalAmount(invoiceData.items);
  const invoiceNumber =
    invoiceData.invoiceNumber || (await generateInvoiceNumber());
  const invoiceId = await generateInvoiceId(invoiceData.branchId);

  // Create invoice with items in a transaction
  const invoice = await prisma.$transaction(async (tx) => {
    const newInvoice = await tx.invoice.create({
      data: {
        clientId: invoiceData.clientId,
        branchId: invoiceData.branchId,
        invoiceNumber,
        invoiceId,
        totalAmount,
        dueDate: invoiceData.dueDate,
        status: InvoiceStatus.PENDING,
        notes: invoiceData.notes,
      },
    });

    // Create invoice items
    const invoiceItems = await Promise.all(
      invoiceData.items.map((item) =>
        tx.invoiceItem.create({
          data: {
            invoiceId: newInvoice.id,
            serviceId: item.serviceId,
            quantity: item.quantity,
            price: item.price,
          },
        })
      )
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
      client: {
        include: {
          service: true,
        },
      },
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
      client: {
        include: {
          service: true,
        },
      },
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
      client: {
        include: {
          service: true,
        },
      },
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
      client: {
        include: {
          service: true,
        },
      },
      items: {
        include: {
          service: true,
        },
      },
    },
  });

  return updatedInvoice;
};

export default {
  createInvoice,
  queryInvoices,
  getInvoiceById,
  updateInvoiceById,
  deleteInvoiceById,
  updateInvoiceStatus,
  generateInvoiceNumber,
};
