import httpStatus from "http-status";
import pick from "../utils/pick";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { clientService } from "../services";
import sendResponse from "../utils/responseHandler";

const createClient = catchAsync(async (req, res) => {
  const {
    name,
    email,
    serviceId,
    branchId,
    phone,
    address,
    assignedEmployeeId,
    city,
    postalCode,
    province,
    status,
  } = req.body;
  const client = await clientService.createClient(
    name,
    email,
    serviceId,
    branchId,
    assignedEmployeeId,
    status,
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
  const filter = pick(req.query, ["name", "email", "serviceId"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await clientService.queryClients(filter, options);

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
