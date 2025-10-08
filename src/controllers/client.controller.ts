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
  const filter = pick(req.query, [
    "name",
    "nationalIdentificationNumber",
    "email",
  ]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);

  // Convert string values to appropriate types for options
  const processedOptions = {
    ...options,
    limit: options.limit ? parseInt(options.limit as string, 10) : undefined,
    page: options.page ? parseInt(options.page as string, 10) : undefined,
  };

  const currentUserRole = req.user?.role;
  const currentUserBranchId = req.user?.branchId || undefined;

  const result = await clientService.queryClients(
    filter,
    processedOptions,
    currentUserRole,
    currentUserBranchId
  );

  sendResponse(
    res,
    httpStatus.OK,
    true,
    { clients: result },
    "Clients retrieved successfully"
  );
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
};
