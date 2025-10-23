import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { clientService } from "../services";
import sendResponse from "../utils/responseHandler";
// Removed ClientStatus import - not used for clients

const createClient = catchAsync(async (req, res) => {
  const {
    name,
    nationalIdentificationNumber,
    email,
    branchId,
    phone,
    address,
    city,
    postalCode,
    province,
  } = req.body;

  const client = await clientService.createClient(
    name,
    email,
    branchId,
    nationalIdentificationNumber,
    phone,
    address,
    city,
    postalCode,
    province
  );

  sendResponse(
    res,
    httpStatus.CREATED,
    true,
    { client },
    "Client created successfully"
  );
});

const getClients = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = "createdAt",
    sortType = "desc",
    branchId,
  } = req.query;

  const paginationOptions = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    search: search as string,
    sortBy: sortBy as string,
    sortType: sortType as "asc" | "desc",
    branchId: branchId as string,
  };

  const currentUserRole = req.user?.role;
  const currentUserBranchId = req.user?.branchId || undefined;

  const result = await clientService.getClientsWithPagination(
    paginationOptions,
    currentUserRole,
    currentUserBranchId
  );

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "Clients retrieved successfully",
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

const getAllClients = catchAsync(async (req, res) => {
  const { sortBy = "createdAt", sortType = "desc" } = req.query;

  const options = {
    sortBy: sortBy as string,
    sortType: sortType as "asc" | "desc",
  };

  const clients = await clientService.getAllClientsForDropdown(options);

  res.status(httpStatus.OK).json({
    success: true,
    status: httpStatus.OK,
    message: "All clients retrieved successfully",
    data: clients,
    total: clients.length,
  });
});

const getClient = catchAsync(async (req, res) => {
  const client = await clientService.getClientById(req.params.clientId);
  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, "Client not found");
  }

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { client },
    "Client retrieved successfully"
  );
});

const updateClient = catchAsync(async (req, res) => {
  const client = await clientService.updateClientById(
    req.params.clientId,
    req.body
  );

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { client },
    "Client updated successfully"
  );
});

const deleteClient = catchAsync(async (req, res) => {
  await clientService.deleteClientById(req.params.clientId);

  sendResponse(res, httpStatus.OK, true, null, "Client deleted successfully");
});

export default {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  getAllClients,
};
