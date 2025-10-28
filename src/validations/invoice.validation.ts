import Joi from "joi";
import { objectId } from "./custom.validation";
import { InvoiceStatus } from "@prisma/client";

const createInvoice = {
  body: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
    branchId: Joi.string().required().custom(objectId),
    employeeId: Joi.string().required().custom(objectId),
    invoiceNumber: Joi.string().optional().allow("", null),
    dueDate: Joi.date().required(),
    thanksMessage: Joi.string().required().min(1),
    notes: Joi.string().optional().allow("", null),
    paymentTerms: Joi.string().optional().allow("", null),
    taxRate: Joi.number().optional().min(0).max(100),
    discountAmount: Joi.number().optional().min(0),
    paymentMethod: Joi.string().optional().allow("", null),
    bankAccountId: Joi.string().optional().custom(objectId),
    // Bank Details Fields (when bank account is selected)
    bankDetails: Joi.object()
      .keys({
        bankName: Joi.string().optional(),
        country: Joi.string().optional(),
        iban: Joi.string().optional(),
        swiftCode: Joi.string().optional(),
      })
      .optional(),
    // Company Information Fields
    companyName: Joi.string().optional().max(100),
    companyTagline: Joi.string().optional().max(200),
    companyAddress: Joi.string().optional().max(200),
    companyCity: Joi.string().optional().max(100),
    companyPhone: Joi.string().optional().max(50),
    companyEmail: Joi.string().email().optional(),
    companyWebsite: Joi.string().optional().max(100),
    companyLogo: Joi.string().optional().allow(""),
    items: Joi.array()
      .items(
        Joi.object().keys({
          serviceId: Joi.string().required().custom(objectId),
          description: Joi.string().required().min(1),
          rate: Joi.number().required().min(0),
          discount: Joi.number().optional().min(0),
        })
      )
      .required()
      .min(1),
  }),
};

const getInvoices = {
  query: Joi.object().keys({
    search: Joi.string().optional(),
    branchId: Joi.string().custom(objectId),
    employeeId: Joi.string().custom(objectId),
    status: Joi.string().valid(...Object.values(InvoiceStatus)),
    invoiceNumber: Joi.string(),
    invoiceId: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid("asc", "desc"),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

const getInvoice = {
  params: Joi.object().keys({
    invoiceId: Joi.string().required().custom(objectId),
  }),
};

const updateInvoice = {
  params: Joi.object().keys({
    invoiceId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      clientId: Joi.string().custom(objectId),
      branchId: Joi.string().custom(objectId),
      employeeId: Joi.string().custom(objectId),
      invoiceNumber: Joi.string(),
      dueDate: Joi.date(),
      status: Joi.string().valid(...Object.values(InvoiceStatus)),
      notes: Joi.string().allow("", null),
      thanksMessage: Joi.string().min(1),
      paymentTerms: Joi.string().allow("", null),
      taxRate: Joi.number().min(0).max(100),
      discountAmount: Joi.number().min(0),
      paymentMethod: Joi.string(),
      bankAccountId: Joi.string().custom(objectId),
      // Bank Details Fields (when bank account is selected)
      bankDetails: Joi.object()
        .keys({
          bankName: Joi.string().optional(),
          country: Joi.string().optional(),
          iban: Joi.string().optional(),
          swiftCode: Joi.string().optional(),
        })
        .optional(),
      // Company Information Fields
      companyName: Joi.string().optional().max(100),
      companyTagline: Joi.string().optional().max(200),
      companyAddress: Joi.string().optional().max(200),
      companyCity: Joi.string().optional().max(100),
      companyPhone: Joi.string().optional().max(50),
      companyEmail: Joi.string().email().optional(),
      companyWebsite: Joi.string().optional().max(100),
      companyLogo: Joi.string().optional().allow(""),
      // Invoice Items
      items: Joi.array()
        .items(
          Joi.object().keys({
            serviceId: Joi.string().required().custom(objectId),
            description: Joi.string().required().min(1),
            rate: Joi.number().required().min(0),
            discount: Joi.number().optional().min(0),
          })
        )
        .optional()
        .min(1),
    })
    .min(1),
};

const deleteInvoice = {
  params: Joi.object().keys({
    invoiceId: Joi.string().required().custom(objectId),
  }),
};

const updateInvoiceStatus = {
  params: Joi.object().keys({
    invoiceId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    status: Joi.string()
      .required()
      .valid(...Object.values(InvoiceStatus)),
  }),
};

const getInvoiceStats = {
  query: Joi.object().keys({
    branchId: Joi.string().custom(objectId),
    clientId: Joi.string().custom(objectId),
    employeeId: Joi.string().custom(objectId),
    startDate: Joi.date(),
    endDate: Joi.date().when("startDate", {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref("startDate")),
    }),
  }),
};

const getRevenueReport = {
  query: Joi.object().keys({
    branchId: Joi.string().custom(objectId),
    clientId: Joi.string().custom(objectId),
    employeeId: Joi.string().custom(objectId),
    status: Joi.string().valid(...Object.values(InvoiceStatus)),
    startDate: Joi.date(),
    endDate: Joi.date().when("startDate", {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref("startDate")),
    }),
    format: Joi.string().valid("excel", "csv").default("excel"),
  }),
};

export default {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  getInvoiceStats,
  getRevenueReport,
};
