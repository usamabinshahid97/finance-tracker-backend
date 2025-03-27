"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.schemas = void 0;
const joi_1 = __importDefault(require("joi"));
const errorMiddleware_1 = require("../api/middleware/errorMiddleware");
// Validation schemas
exports.schemas = {
    account: {
        create: joi_1.default.object({
            name: joi_1.default.string().required().max(100),
            accountNumber: joi_1.default.string().max(30),
            bankName: joi_1.default.string().required().max(100),
            balance: joi_1.default.number().default(0),
        }),
        update: joi_1.default.object({
            name: joi_1.default.string().max(100),
            accountNumber: joi_1.default.string().max(30),
            bankName: joi_1.default.string().max(100),
            balance: joi_1.default.number(),
        }),
    },
    creditCard: {
        create: joi_1.default.object({
            name: joi_1.default.string().required().max(100),
            cardNumber: joi_1.default.string().max(30),
            bank: joi_1.default.string().required().max(100),
            creditLimit: joi_1.default.number().required().min(0),
        }),
        update: joi_1.default.object({
            name: joi_1.default.string().max(100),
            cardNumber: joi_1.default.string().max(30),
            bank: joi_1.default.string().max(100),
            creditLimit: joi_1.default.number().min(0),
        }),
    },
    category: {
        create: joi_1.default.object({
            name: joi_1.default.string().required().max(50),
            type: joi_1.default.string().required().valid("INCOME", "EXPENSE"),
        }),
        update: joi_1.default.object({
            name: joi_1.default.string().max(50),
            type: joi_1.default.string().valid("INCOME", "EXPENSE"),
        }),
    },
    transaction: {
        create: joi_1.default.object({
            amount: joi_1.default.number().required().greater(0),
            description: joi_1.default.string().required().max(255),
            date: joi_1.default.date().required(),
            categoryId: joi_1.default.string().guid(),
            isExpense: joi_1.default.boolean().required(),
            accountId: joi_1.default.string().guid(),
            creditCardId: joi_1.default.string().guid(),
        }).custom((value, helpers) => {
            if (!value.accountId && !value.creditCardId) {
                return helpers.error("Either accountId or creditCardId must be provided");
            }
            if (value.accountId && value.creditCardId) {
                return helpers.error("Only one of accountId or creditCardId should be provided");
            }
            return value;
        }),
        update: joi_1.default.object({
            amount: joi_1.default.number().greater(0),
            description: joi_1.default.string().max(255),
            date: joi_1.default.date(),
            categoryId: joi_1.default.string().guid(),
            isExpense: joi_1.default.boolean(),
            accountId: joi_1.default.string().guid(),
            creditCardId: joi_1.default.string().guid(),
        }),
    },
};
// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (!error)
            return next();
        const errorMessage = error.details
            .map((detail) => detail.message)
            .join(", ");
        throw new errorMiddleware_1.ApiError(400, errorMessage);
    };
};
exports.validate = validate;
