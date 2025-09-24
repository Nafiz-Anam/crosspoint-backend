import { Client, ClientStatus, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";

/**
 * Generate unique customer ID for a branch
 * @param {string} branchId
 * @returns {Promise<string>}
 */
const generateClientId = async (branchId: string): Promise<string> => {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Branch not found");
  }

  // Get count of clients in this branch
  const clientCount = await prisma.client.count({
    where: { branchId },
  });

  const sequence = String(clientCount + 1).padStart(3, "0");
  return `CLT-${branch.branchId}-${sequence}`;
};

/**
 * Create a client
 * @param {Object} clientBody
 * @returns {Promise<Client>}
 */
const createClient = async (
  name: string,
  email: string,
  branchId: string,
  status: ClientStatus,
  phone?: string,
  address?: string,
  city?: string,
  postalCode?: string,
  province?: string,
  nationalIdentificationNumber?: string
): Promise<Client> => {
  // Check if client with same email already exists
  const existingClient = await prisma.client.findUnique({
    where: { email },
  });

  if (existingClient) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Client with this email already exists"
    );
  }

  // Check if client with same national identification number already exists
  if (nationalIdentificationNumber) {
    const existingClientByNationalId = await prisma.client.findUnique({
      where: { nationalIdentificationNumber },
    });

    if (existingClientByNationalId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Client with this national identification number already exists"
      );
    }
  }

  // Check if branch exists
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!branch) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Branch not found");
  }

  const clientId = await generateClientId(branchId);

  return prisma.client.create({
    data: {
      name,
      nationalIdentificationNumber,
      email,
      phone,
      address,
      city,
      postalCode,
      province: province?.toUpperCase(),
      branchId,
      clientId,
      status,
    },
    include: {
      branch: true,
    },
  });
};

/**
 * Query for clients
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<Client[]>}
 */
const queryClients = async (
  filter: object,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  }
): Promise<Client[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? "desc";

  const clients = await prisma.client.findMany({
    where: filter,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
    include: {
      branch: true,
      _count: {
        select: {
          invoices: true,
          tasks: true,
        },
      },
    },
  });

  return clients;
};

/**
 * Get client by id
 * @param {string} id
 * @returns {Promise<Client | null>}
 */
const getClientById = async (id: string): Promise<Client | null> => {
  return prisma.client.findUnique({
    where: { id },
    include: {
      branch: true,
      invoices: {
        include: {
          items: {
            include: {
              service: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
};

/**
 * Update client by id
 * @param {string} clientId
 * @param {Object} updateBody
 * @returns {Promise<Client | null>}
 */
const updateClientById = async (
  clientId: string,
  updateBody: Prisma.ClientUpdateInput
): Promise<Client | null> => {
  const client = await getClientById(clientId);
  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, "Client not found");
  }

  // Check if new email conflicts with existing client
  if (updateBody.email && updateBody.email !== client.email) {
    const existingClient = await prisma.client.findFirst({
      where: {
        email: updateBody.email as string,
        id: { not: clientId },
      },
    });

    if (existingClient) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Client with this email already exists"
      );
    }
  }

  const updatedClient = await prisma.client.update({
    where: { id: clientId },
    data: updateBody,
    include: {
      branch: true,
    },
  });

  return updatedClient;
};

/**
 * Delete client by id
 * @param {string} clientId
 * @returns {Promise<Client>}
 */
const deleteClientById = async (clientId: string): Promise<Client> => {
  const client = await getClientById(clientId);
  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, "Client not found");
  }

  // Check if client has associated invoices
  const invoiceCount = await prisma.invoice.count({
    where: { clientId },
  });

  if (invoiceCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete client. It has ${invoiceCount} associated invoice(s).`
    );
  }

  await prisma.client.delete({ where: { id: clientId } });
  return client;
};

export default {
  createClient,
  queryClients,
  getClientById,
  updateClientById,
  deleteClientById,
};
