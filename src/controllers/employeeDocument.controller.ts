import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { employeeDocumentService } from "../services";
import sendResponse from "../utils/responseHandler";

const uploadDocument = catchAsync(async (req, res) => {
  const { employeeId } = req.params;
  const { name, type, description, expiryDate } = req.body;

  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Document file is required");
  }

  if (!name || !type) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Document name and type are required");
  }

  const document = await employeeDocumentService.uploadDocument(employeeId, req.file, {
    name,
    type,
    description,
    expiryDate: expiryDate ? new Date(expiryDate) : undefined,
  });

  sendResponse(res, httpStatus.CREATED, true, { document }, "Document uploaded successfully");
});

const getEmployeeDocuments = catchAsync(async (req, res) => {
  const { employeeId } = req.params;
  const documents = await employeeDocumentService.getEmployeeDocuments(employeeId);
  sendResponse(res, httpStatus.OK, true, { documents }, "Employee documents retrieved successfully");
});

const getDocuments = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = "createdAt",
    sortType = "desc",
    employeeId,
    type,
    isVerified,
  } = req.query;

  const paginationOptions = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    search: search as string,
    sortBy: sortBy as string,
    sortType: sortType as "asc" | "desc",
    employeeId: employeeId as string,
    type: type as string,
    isVerified: isVerified as string,
  };

  const result = await employeeDocumentService.getDocumentsWithPagination(paginationOptions);

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "Documents retrieved successfully",
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
    },
  });
});

const getDocument = catchAsync(async (req, res) => {
  const { documentId } = req.params;
  const document = await employeeDocumentService.getDocumentById(documentId);
  sendResponse(res, httpStatus.OK, true, { document }, "Document retrieved successfully");
});

const updateDocument = catchAsync(async (req, res) => {
  const { documentId } = req.params;
  const updateData = pick(req.body, ["name", "type", "description", "expiryDate"]);

  if (updateData.expiryDate && typeof updateData.expiryDate === 'string') {
    updateData.expiryDate = new Date(updateData.expiryDate);
  } else if (updateData.expiryDate && !(updateData.expiryDate instanceof Date)) {
    delete updateData.expiryDate; // Remove invalid date
  }

  const document = await employeeDocumentService.updateDocument(documentId, updateData);
  sendResponse(res, httpStatus.OK, true, { document }, "Document updated successfully");
});

const verifyDocument = catchAsync(async (req, res) => {
  const { documentId } = req.params;
  const verifiedBy = req.user?.id || req.employee?.id;

  if (!verifiedBy) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const document = await employeeDocumentService.verifyDocument(documentId, verifiedBy);
  sendResponse(res, httpStatus.OK, true, { document }, "Document verified successfully");
});

const deleteDocument = catchAsync(async (req, res) => {
  const { documentId } = req.params;
  await employeeDocumentService.deleteDocument(documentId);
  sendResponse(res, httpStatus.OK, true, null, "Document deleted successfully");
});

const getExpiringDocuments = catchAsync(async (req, res) => {
  const { days = 30 } = req.query;
  const documents = await employeeDocumentService.getExpiringDocuments(parseInt(days as string));
  sendResponse(res, httpStatus.OK, true, { documents }, "Expiring documents retrieved successfully");
});

export default {
  uploadDocument,
  getEmployeeDocuments,
  getDocuments,
  getDocument,
  updateDocument,
  verifyDocument,
  deleteDocument,
  getExpiringDocuments,
};
