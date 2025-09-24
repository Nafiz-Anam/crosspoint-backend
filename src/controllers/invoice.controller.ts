import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { invoiceService } from "../services";
import { InvoiceStatus } from "@prisma/client";
import sendResponse from "../utils/responseHandler";

const createInvoice = catchAsync(async (req, res) => {
  const {
    clientId,
    branchId,
    employeeId,
    invoiceNumber,
    dueDate,
    items,
    notes,
    thanksMessage,
    paymentTerms,
    taxRate,
    discountAmount,
    paymentMethod,
    bankAccountId,
    // Company Information Fields
    companyName,
    companyTagline,
    companyAddress,
    companyCity,
    companyPhone,
    companyEmail,
    companyWebsite,
    companyLogo,
  } = req.body;

  // Validate required fields
  if (
    !clientId ||
    !branchId ||
    !employeeId ||
    !thanksMessage ||
    !items ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Missing required fields: clientId, branchId, employeeId, thanksMessage, and items array"
    );
  }

  // Validate each item has required fields
  for (const item of items) {
    if (!item.serviceId || !item.description || !item.rate) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Each item must have serviceId, description, and rate"
      );
    }
  }

  const invoice = await invoiceService.createInvoice({
    clientId,
    branchId,
    employeeId,
    invoiceNumber,
    dueDate: new Date(dueDate),
    items,
    notes,
    thanksMessage,
    paymentTerms,
    taxRate: taxRate || 0,
    discountAmount: discountAmount || 0,
    paymentMethod,
    bankAccountId,
    // Company Information Fields
    companyName,
    companyTagline,
    companyAddress,
    companyCity,
    companyPhone,
    companyEmail,
    companyWebsite,
    companyLogo,
  });

  sendResponse(
    res,
    httpStatus.CREATED,
    true,
    { invoice },
    "Invoice created successfully"
  );
});

const getInvoices = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    "clientId",
    "branchId",
    "employeeId",
    "status",
    "invoiceNumber",
    "invoiceId",
  ]);
  const options = pick(req.query, ["sortBy", "sortType", "limit", "page"]);

  // Convert string values to appropriate types for filter
  if (filter.status && typeof filter.status === "string") {
    // Validate status if provided
    if (
      !Object.values(InvoiceStatus).includes(filter.status as InvoiceStatus)
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid invoice status filter"
      );
    }
  }

  // Convert string values to appropriate types for options
  const processedOptions = {
    ...options,
    limit: options.limit ? parseInt(options.limit as string, 10) : undefined,
    page: options.page ? parseInt(options.page as string, 10) : undefined,
  };

  const result = await invoiceService.queryInvoices(filter, processedOptions);

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { invoices: result },
    "Invoices retrieved successfully"
  );
});

const getInvoice = catchAsync(async (req, res) => {
  const { invoiceId } = req.params;

  if (!invoiceId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invoice ID is required");
  }

  const invoice = await invoiceService.getInvoiceById(invoiceId);
  if (!invoice) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invoice not found");
  }

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { invoice },
    "Invoice retrieved successfully"
  );
});

const updateInvoice = catchAsync(async (req, res) => {
  const { invoiceId } = req.params;
  const updateData = req.body;

  if (!invoiceId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invoice ID is required");
  }

  // If dueDate is being updated, convert to Date
  if (updateData.dueDate) {
    updateData.dueDate = new Date(updateData.dueDate);
  }

  // Validate status if being updated
  if (
    updateData.status &&
    !Object.values(InvoiceStatus).includes(updateData.status)
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid invoice status");
  }

  // Handle items update if provided
  if (updateData.items && Array.isArray(updateData.items)) {
    // Validate each item
    for (const item of updateData.items) {
      if (!item.serviceId || !item.description || !item.rate) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Each item must have serviceId, description, and rate"
        );
      }

      if (item.rate <= 0) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Rate must be greater than 0"
        );
      }

      if (item.discount && item.discount < 0) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Discount cannot be negative"
        );
      }
    }

    // Use the service method that handles items update with recalculation
    const invoice = await invoiceService.updateInvoiceWithItems(
      invoiceId,
      updateData
    );

    sendResponse(
      res,
      httpStatus.OK,
      true,
      { invoice },
      "Invoice updated successfully"
    );
    return;
  }

  // Transform the update data to match Prisma schema
  const transformedUpdateData = { ...updateData };

  // Convert ID fields to nested connect objects
  if (updateData.clientId) {
    transformedUpdateData.client = { connect: { id: updateData.clientId } };
    delete transformedUpdateData.clientId;
  }

  if (updateData.branchId) {
    transformedUpdateData.branch = { connect: { id: updateData.branchId } };
    delete transformedUpdateData.branchId;
  }

  if (updateData.employeeId) {
    transformedUpdateData.employee = { connect: { id: updateData.employeeId } };
    delete transformedUpdateData.employeeId;
  }

  // Handle bank account fields - remove them as they should be handled through bankAccount relationship
  if (updateData.bankAccountId) {
    transformedUpdateData.bankAccount = {
      connect: { id: updateData.bankAccountId },
    };
    delete transformedUpdateData.bankAccountId;
  }

  // Remove bank detail fields that don't exist in the invoice schema
  delete transformedUpdateData.bankName;
  delete transformedUpdateData.bankCountry;
  delete transformedUpdateData.bankIban;
  delete transformedUpdateData.bankSwiftCode;

  // Company info fields are already in the correct format, no transformation needed

  const invoice = await invoiceService.updateInvoiceById(
    invoiceId,
    transformedUpdateData
  );

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { invoice },
    "Invoice updated successfully"
  );
});

const deleteInvoice = catchAsync(async (req, res) => {
  const { invoiceId } = req.params;

  if (!invoiceId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invoice ID is required");
  }

  await invoiceService.deleteInvoiceById(invoiceId);

  sendResponse(res, httpStatus.OK, true, null, "Invoice deleted successfully");
});

const updateInvoiceStatus = catchAsync(async (req, res) => {
  const { invoiceId } = req.params;
  const { status } = req.body;

  if (!invoiceId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invoice ID is required");
  }

  if (!status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Status is required");
  }

  // Validate status
  if (!Object.values(InvoiceStatus).includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid invoice status");
  }

  const invoice = await invoiceService.updateInvoiceStatus(invoiceId, status);

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { invoice },
    "Invoice status updated successfully"
  );
});

const generateInvoiceNumber = catchAsync(async (req, res) => {
  const invoiceNumber = await invoiceService.generateInvoiceNumber();

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { invoiceNumber },
    "Invoice number generated successfully"
  );
});

const getInvoiceStats = catchAsync(async (req, res) => {
  const { branchId, clientId, employeeId, startDate, endDate } = req.query;

  let filter: any = {};

  if (branchId) filter.branchId = branchId;
  if (clientId) filter.clientId = clientId;
  if (employeeId) filter.employeeId = employeeId;

  if (startDate && endDate) {
    filter.createdAt = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  }

  const invoices = await invoiceService.queryInvoices(filter, { limit: 1000 });

  const stats = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    subTotalAmount: invoices.reduce((sum, inv) => sum + inv.subTotalAmount, 0),
    taxAmount: invoices.reduce((sum, inv) => sum + inv.taxAmount, 0),
    discountAmount: invoices.reduce((sum, inv) => sum + inv.discountAmount, 0),
    paidInvoices: invoices.filter((inv) => inv.status === InvoiceStatus.PAID)
      .length,
    unpaidInvoices: invoices.filter(
      (inv) => inv.status === InvoiceStatus.UNPAID
    ).length,
    overdueInvoices: invoices.filter(
      (inv) =>
        inv.status === InvoiceStatus.UNPAID &&
        new Date(inv.dueDate) < new Date()
    ).length,
    statusBreakdown: {
      [InvoiceStatus.PAID]: invoices.filter(
        (inv) => inv.status === InvoiceStatus.PAID
      ).length,
      [InvoiceStatus.UNPAID]: invoices.filter(
        (inv) => inv.status === InvoiceStatus.UNPAID
      ).length,
      [InvoiceStatus.OVERDUE]: invoices.filter(
        (inv) => inv.status === InvoiceStatus.OVERDUE
      ).length,
    },
  };

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { stats },
    "Invoice statistics retrieved successfully"
  );
});

const createInvoiceFromTask = catchAsync(async (req, res) => {
  const { taskId } = req.params;
  const {
    dueDate,
    notes,
    thanksMessage,
    paymentTerms,
    taxRate,
    discountAmount,
    paymentMethod,
    bankAccountId,
  } = req.body;

  if (!dueDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Due date is required");
  }

  const invoice = await invoiceService.createInvoiceFromTask(taskId, {
    dueDate: new Date(dueDate),
    notes,
    thanksMessage,
    paymentTerms,
    taxRate,
    discountAmount,
    paymentMethod,
    bankAccountId,
  });

  sendResponse(
    res,
    httpStatus.CREATED,
    true,
    { invoice },
    "Invoice created from task successfully"
  );
});

export default {
  createInvoice,
  createInvoiceFromTask,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  generateInvoiceNumber,
  getInvoiceStats,
};
