import Joi from "joi";
import { Request, Response, NextFunction } from "express";
export declare const schemas: {
    account: {
        create: Joi.ObjectSchema<any>;
        update: Joi.ObjectSchema<any>;
    };
    creditCard: {
        create: Joi.ObjectSchema<any>;
        update: Joi.ObjectSchema<any>;
    };
    category: {
        create: Joi.ObjectSchema<any>;
        update: Joi.ObjectSchema<any>;
    };
    transaction: {
        create: Joi.ObjectSchema<any>;
        update: Joi.ObjectSchema<any>;
    };
};
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
