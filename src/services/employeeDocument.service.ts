import { EmployeeDocument } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import prisma from "../client";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import config from "../config/config";

// Upload employee document
const uploadDocument = async (
  employeeId: string,
  file: any,
  data: {
    name: string;
    type: string;
    description?: string;
    expiryDate?: Date;
  }
): Promise<EmployeeDocument> => {
  // Validate employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "employee-documents");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `doc-${employeeId}-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    const writeFile = promisify(fs.writeFile);
    await writeFile(filePath, file.buffer);

    // Get file size
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Return the full public URL
    const fileUrl = `${config.baseUrl}/uploads/employee-documents/${fileName}`;

    // Create document record
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId,
        name: data.name,
        type: data.type,
        fileUrl,
        fileName: file.originalname,
        fileSize,
        mimeType: file.mimetype,
        description: data.description,
        expiryDate: data.expiryDate,
        isVerified: false,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    return document;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to upload document");
  }
};

// Get all documents for an employee
const getEmployeeDocuments = async (employeeId: string): Promise<EmployeeDocument[]> => {
  // Validate employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  return prisma.employeeDocument.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
  });
};

// Get documents with pagination
const getDocumentsWithPagination = async (options: {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortType: "asc" | "desc";
  employeeId?: string;
  type?: string;
  isVerified?: string;
}) => {
  const { page, limit, search, sortBy, sortType, employeeId, type, isVerified } = options;
  const skip = (page - 1) * limit;

  // Build where clause
  let whereClause: any = {};

  if (employeeId) {
    whereClause.employeeId = employeeId;
  }

  if (type) {
    whereClause.type = type;
  }

  if (isVerified !== undefined && isVerified !== "") {
    whereClause.isVerified = isVerified === "true";
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { type: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
      { employee: { name: { contains: search, mode: "insensitive" as const } } },
    ];
  }

  // Build orderBy clause
  const orderByClause = {
    [sortBy]: sortType,
  };

  // Get total count
  const total = await prisma.employeeDocument.count({ where: whereClause });

  // Get paginated data
  const documents = await prisma.employeeDocument.findMany({
    where: whereClause,
    orderBy: orderByClause,
    skip,
    take: limit,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          email: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: documents,
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

// Get document by ID
const getDocumentById = async (id: string): Promise<EmployeeDocument> => {
  const document = await prisma.employeeDocument.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          email: true,
        },
      },
    },
  });

  if (!document) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Document not found");
  }

  return document;
};

// Update document
const updateDocument = async (
  id: string,
  updateData: Partial<{
    name: string;
    type: string;
    description: string;
    expiryDate: Date;
  }>
): Promise<EmployeeDocument> => {
  const document = await getDocumentById(id);

  const updated = await prisma.employeeDocument.update({
    where: { id },
    data: updateData,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
    },
  });

  return updated;
};

// Verify document
const verifyDocument = async (id: string, verifiedBy: string): Promise<EmployeeDocument> => {
  const document = await getDocumentById(id);

  const updated = await prisma.employeeDocument.update({
    where: { id },
    data: {
      isVerified: true,
      verifiedBy,
      verifiedAt: new Date(),
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
    },
  });

  return updated;
};

// Delete document
const deleteDocument = async (id: string): Promise<void> => {
  const document = await getDocumentById(id);

  // Delete file from filesystem
  try {
    const filePath = document.fileUrl.replace(config.baseUrl, process.cwd() + "/public");
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    // Continue with database deletion even if file deletion fails
  }

  // Delete from database
  await prisma.employeeDocument.delete({ where: { id } });
};

// Get documents expiring soon (within specified days)
const getExpiringDocuments = async (days: number = 30): Promise<EmployeeDocument[]> => {
  const today = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(today.getDate() + days);

  return prisma.employeeDocument.findMany({
    where: {
      expiryDate: {
        gte: today,
        lte: expiryDate,
      },
      isVerified: true, // Only show verified documents
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          email: true,
        },
      },
    },
    orderBy: {
      expiryDate: "asc",
    },
  });
};

export default {
  uploadDocument,
  getEmployeeDocuments,
  getDocumentsWithPagination,
  getDocumentById,
  updateDocument,
  verifyDocument,
  deleteDocument,
  getExpiringDocuments,
};
