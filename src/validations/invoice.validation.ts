import Joi from "joi";
import { objectId } from "./custom.validation";
import { InvoiceStatus } from "@prisma/client";

const createInvoice = {
  body: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
    branchId: Joi.string().required().custom(objectId),
    invoiceNumber: Joi.string().optional(),
    dueDate: Joi.date().required(),
    items: Joi.array()
      .items(
        Joi.object().keys({
          serviceId: Joi.string().required().custom(objectId),
          quantity: Joi.number().required().min(1),
          price: Joi.number().required().min(0),
        })
      )
      .required()
      .min(1),
  }),
};

const getInvoices = {
  query: Joi.object().keys({
    clientId: Joi.string().custom(objectId),
    branchId: Joi.string().custom(objectId),
    status: Joi.string().valid(...Object.values(InvoiceStatus)),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getInvoice = {
  params: Joi.object().keys({
    invoiceId: Joi.string().custom(objectId),
  }),
};

const updateInvoice = {
  params: Joi.object().keys({
    invoiceId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      clientId: Joi.string().custom(objectId),
      branchId: Joi.string().custom(objectId),
      invoiceNumber: Joi.string(),
      dueDate: Joi.date(),
      status: Joi.string().valid(...Object.values(InvoiceStatus)),
    })
    .min(1),
};

const deleteInvoice = {
  params: Joi.object().keys({
    invoiceId: Joi.string().custom(objectId),
  }),
};

const updateInvoiceStatus = {
  params: Joi.object().keys({
    invoiceId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    status: Joi.string()
      .required()
      .valid(...Object.values(InvoiceStatus)),
  }),
};

export default {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
};
