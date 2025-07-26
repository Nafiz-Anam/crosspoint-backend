import { Service, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";

/**
 * Create a service
 * @param {Object} serviceBody
 * @returns {Promise<Service>}
 */
const createService = async (name: string): Promise<Service> => {
  // Check if service with same name already exists
  const existingService = await prisma.service.findFirst({
    where: { name },
  });

  if (existingService) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Service with this name already exists"
    );
  }

  return prisma.service.create({
    data: { name },
  });
};

/**
 * Query for services
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<Service[]>}
 */
const queryServices = async (
  filter: object,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: "asc" | "desc";
  }
): Promise<Service[]> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy;
  const sortType = options.sortType ?? "desc";

  const services = await prisma.service.findMany({
    where: filter,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined,
    include: {
      _count: {
        select: {
          clients: true,
          invoiceItems: true,
        },
      },
    },
  });

  return services;
};

/**
 * Get service by id
 * @param {string} id
 * @returns {Promise<Service | null>}
 */
const getServiceById = async (id: string): Promise<Service | null> => {
  return prisma.service.findUnique({
    where: { id },
    include: {
      clients: true,
      invoiceItems: true,
    },
  });
};

/**
 * Update service by id
 * @param {string} serviceId
 * @param {Object} updateBody
 * @returns {Promise<Service | null>}
 */
const updateServiceById = async (
  serviceId: string,
  updateBody: Prisma.ServiceUpdateInput
): Promise<Service | null> => {
  const service = await getServiceById(serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }

  // Check if new name conflicts with existing service
  if (updateBody.name && updateBody.name !== service.name) {
    const existingService = await prisma.service.findFirst({
      where: {
        name: updateBody.name as string,
        id: { not: serviceId },
      },
    });

    if (existingService) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Service with this name already exists"
      );
    }
  }

  const updatedService = await prisma.service.update({
    where: { id: serviceId },
    data: updateBody,
  });

  return updatedService;
};

/**
 * Delete service by id
 * @param {string} serviceId
 * @returns {Promise<Service>}
 */
const deleteServiceById = async (serviceId: string): Promise<Service> => {
  const service = await getServiceById(serviceId);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }

  // Check if service has associated clients
  const clientCount = await prisma.client.count({
    where: { serviceId },
  });

  if (clientCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete service. It has ${clientCount} associated client(s).`
    );
  }

  await prisma.service.delete({ where: { id: serviceId } });
  return service;
};

export default {
  createService,
  queryServices,
  getServiceById,
  updateServiceById,
  deleteServiceById,
};
