import Joi from "joi";
import { objectId } from "./custom.validation";

const createClient = {
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(100),
    nationalIdentificationNumber: Joi.string().required().min(5).max(20),
    email: Joi.string().required().email(),
    phone: Joi.string().optional().allow(null, ""),
    address: Joi.string().optional().allow(null, "").max(500),
    city: Joi.string().optional().allow(null, "").max(100),
    postalCode: Joi.string().optional().allow(null, "").max(20),
    province: Joi.string().optional().allow(null, "").length(2).uppercase(), // 2-letter Italian province code
    branchId: Joi.string().required().custom(objectId),
    status: Joi.string()
      .valid("ACTIVE", "PENDING", "PROCESSING", "CANCELLED", "COMPLETED")
      .default("PENDING"),
  }),
};

const getClients = {
  query: Joi.object().keys({
    name: Joi.string(),
    nationalIdentificationNumber: Joi.string(),
    email: Joi.string(),
    phone: Joi.string(),
    city: Joi.string(),
    province: Joi.string().length(2).uppercase(),
    branchId: Joi.string().custom(objectId),
    status: Joi.string().valid(
      "ACTIVE",
      "PENDING",
      "PROCESSING",
      "CANCELLED",
      "COMPLETED"
    ),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    page: Joi.number().integer().min(1).default(1),
  }),
};

const getClient = {
  params: Joi.object().keys({
    clientId: Joi.string().custom(objectId),
  }),
};

const updateClient = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().min(2).max(100),
      nationalIdentificationNumber: Joi.string().required().min(5).max(20),
      email: Joi.string().email(),
      phone: Joi.string().allow(null, ""),
      address: Joi.string().allow(null, "").max(500),
      city: Joi.string().allow(null, "").max(100),
      postalCode: Joi.string().allow(null, "").max(20),
      province: Joi.string().allow(null, "").length(2).uppercase(),
      branchId: Joi.string().custom(objectId),
      status: Joi.string().valid(
        "ACTIVE",
        "PENDING",
        "PROCESSING",
        "CANCELLED",
        "COMPLETED"
      ),
    })
    .min(1),
};

const deleteClient = {
  params: Joi.object().keys({
    clientId: Joi.string().custom(objectId),
  }),
};

// Additional validation for bulk operations (if needed)
const bulkUpdateClients = {
  body: Joi.object().keys({
    clientIds: Joi.array()
      .items(Joi.string().custom(objectId))
      .min(1)
      .required(),
    updates: Joi.object()
      .keys({
        status: Joi.string().valid(
          "ACTIVE",
          "PENDING",
          "PROCESSING",
          "CANCELLED",
          "COMPLETED"
        ),
        branchId: Joi.string().custom(objectId),
      })
      .min(1)
      .required(),
  }),
};

// Validation for client status updates
const updateClientStatus = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    status: Joi.string()
      .valid("ACTIVE", "PENDING", "PROCESSING", "CANCELLED", "COMPLETED")
      .required(),
  }),
};

export default {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  bulkUpdateClients,
  updateClientStatus,
};
