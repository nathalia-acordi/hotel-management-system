import Joi from "joi";

export const createRoomSchema = Joi.object({
  number: Joi.number().integer().min(1).required(),
  type: Joi.string().valid("standard", "deluxe", "suite").required(),
  capacity: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required(),
  status: Joi.string().valid("free", "occupied", "maintenance").default("free"),
  maintenance: Joi.boolean().default(false),
});

export const updateRoomSchema = Joi.object({
  number: Joi.number().integer().min(1),
  type: Joi.string().valid("standard", "deluxe", "suite"),
  capacity: Joi.number().integer().min(1),
  price: Joi.number().min(0),
  status: Joi.string().valid("free", "occupied", "maintenance"),
  maintenance: Joi.boolean(),
}).min(1);

export const patchStatusSchema = Joi.object({
  status: Joi.string().valid("free", "occupied", "maintenance").required(),
});
