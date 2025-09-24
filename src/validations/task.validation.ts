import Joi from "joi";
import { TaskStatus } from "@prisma/client";

const createTask = {
  body: Joi.object().keys({
    description: Joi.string().optional().max(1000),
    clientId: Joi.string().required().uuid(),
    serviceId: Joi.string().required().uuid(),
    assignedEmployeeId: Joi.string().required().uuid(),
    status: Joi.string()
      .valid(...Object.values(TaskStatus))
      .optional(),
    dueDate: Joi.date().optional().min("now"),
    startDate: Joi.date().optional(),
    notes: Joi.string().optional().max(1000),
  }),
};

const getTasks = {
  query: Joi.object().keys({
    title: Joi.string().optional(),
    status: Joi.string()
      .valid(...Object.values(TaskStatus))
      .optional(),
    clientId: Joi.string().optional().uuid(),
    serviceId: Joi.string().optional().uuid(),
    assignedEmployeeId: Joi.string().optional().uuid(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    page: Joi.number().integer().min(1).optional(),
  }),
};

const getTask = {
  params: Joi.object().keys({
    taskId: Joi.string().required().uuid(),
  }),
};

const updateTask = {
  params: Joi.object().keys({
    taskId: Joi.string().required().uuid(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().optional().min(1).max(255),
      description: Joi.string().optional().max(1000),
      clientId: Joi.string().optional().uuid(),
      serviceId: Joi.string().optional().uuid(),
      assignedEmployeeId: Joi.string().optional().uuid(),
      status: Joi.string()
        .valid(...Object.values(TaskStatus))
        .optional(),
      dueDate: Joi.date().optional().allow(null),
      startDate: Joi.date().optional().allow(null),
      completedDate: Joi.date().optional().allow(null),
      estimatedHours: Joi.number().optional().min(0).max(1000).allow(null),
      actualHours: Joi.number().optional().min(0).max(1000).allow(null),
      notes: Joi.string().optional().max(1000).allow(null),
    })
    .min(1),
};

const deleteTask = {
  params: Joi.object().keys({
    taskId: Joi.string().required().uuid(),
  }),
};

const getTasksByClient = {
  params: Joi.object().keys({
    clientId: Joi.string().required().uuid(),
  }),
};

export {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getTasksByClient,
};
