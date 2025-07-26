import Joi from "joi";
import { objectId } from "./custom.validation";

const createClient = {
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().required().email(),
    phone: Joi.string().optional(),
    address: Joi.string().optional().max(500),
    serviceId: Joi.string().required().custom(objectId),
    branchId: Joi.string().required().custom(objectId),
  }),
};

const getClients = {
  query: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string(),
    serviceId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getClient = {
  params: Joi.object().keys({
    clientId: Joi.string().custom(objectId),
  }),
};

const updateClient = {
  params: Joi.object().keys({
    clientId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().min(2).max(100),
      email: Joi.string().email(),
      phone: Joi.string(),
      address: Joi.string().max(500),
      serviceId: Joi.string().custom(objectId),
      branchId: Joi.string().custom(objectId),
    })
    .min(1),
};

const deleteClient = {
  params: Joi.object().keys({
    clientId: Joi.string().custom(objectId),
  }),
};

export default {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
};
