import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { invoiceService } from "../services";
import { InvoiceStatus } from "@prisma/client";
import sendResponse from "../utils/responseHandler";

const createInvoice = catchAsync(async (req, res) => {
  const { clientId, branchId, invoiceNumber, dueDate, items } = req.body;

  const invoice = await invoiceService.createInvoice({
    clientId,
    branchId,
    invoiceNumber,
    dueDate: new Date(dueDate),
    items,
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
  const filter = pick(req.query, ["clientId", "status", "invoiceNumber"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await invoiceService.queryInvoices(filter, options);

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { invoices: result },
    "Invoices retrieved successfully"
  );
});

const getInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.invoiceId);
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
  const invoice = await invoiceService.updateInvoiceById(
    req.params.invoiceId,
    req.body
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
  await invoiceService.deleteInvoiceById(req.params.invoiceId);

  sendResponse(res, httpStatus.OK, true, null, "Invoice deleted successfully");
});

const updateInvoiceStatus = catchAsync(async (req, res) => {
  const { status } = req.body;

  // Validate status
  if (!Object.values(InvoiceStatus).includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid invoice status");
  }

  const invoice = await invoiceService.updateInvoiceStatus(
    req.params.invoiceId,
    status
  );

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

export default {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  generateInvoiceNumber,
};
