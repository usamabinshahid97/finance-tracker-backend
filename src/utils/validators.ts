import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../api/middleware/errorMiddleware";

// Validation schemas
export const schemas = {
  account: {
    create: Joi.object({
      name: Joi.string().required().max(100),
      accountNumber: Joi.string().max(30),
      bankName: Joi.string().required().max(100),
      balance: Joi.number().default(0),
    }),
    update: Joi.object({
      name: Joi.string().max(100),
      accountNumber: Joi.string().max(30),
      bankName: Joi.string().max(100),
      balance: Joi.number(),
    }),
  },
  creditCard: {
    create: Joi.object({
      name: Joi.string().required().max(100),
      cardNumber: Joi.string().max(30),
      bank: Joi.string().required().max(100),
      creditLimit: Joi.number().required().min(0),
    }),
    update: Joi.object({
      name: Joi.string().max(100),
      cardNumber: Joi.string().max(30),
      bank: Joi.string().max(100),
      creditLimit: Joi.number().min(0),
    }),
  },
  category: {
    create: Joi.object({
      name: Joi.string().required().max(50),
      type: Joi.string().required().valid("INCOME", "EXPENSE"),
    }),
    update: Joi.object({
      name: Joi.string().max(50),
      type: Joi.string().valid("INCOME", "EXPENSE"),
    }),
  },
  transaction: {
    create: Joi.object({
      amount: Joi.number().required().greater(0),
      description: Joi.string().required().max(255),
      date: Joi.date().required(),
      categoryId: Joi.string().guid(),
      isExpense: Joi.boolean().required(),
      accountId: Joi.string().guid(),
      creditCardId: Joi.string().guid(),
    }).custom((value, helpers) => {
      if (!value.accountId && !value.creditCardId) {
        return helpers.error(
          "Either accountId or creditCardId must be provided"
        );
      }
      if (value.accountId && value.creditCardId) {
        return helpers.error(
          "Only one of accountId or creditCardId should be provided"
        );
      }
      return value;
    }),
    update: Joi.object({
      amount: Joi.number().greater(0),
      description: Joi.string().max(255),
      date: Joi.date(),
      categoryId: Joi.string().guid(),
      isExpense: Joi.boolean(),
      accountId: Joi.string().guid(),
      creditCardId: Joi.string().guid(),
    }),
  },
};

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (!error) return next();

    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(", ");

    throw new ApiError(400, errorMessage);
  };
};
