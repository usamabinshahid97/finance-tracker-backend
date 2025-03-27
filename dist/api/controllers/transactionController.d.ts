import { Request, Response } from "express";
export declare const transactionController: {
    getTransactions(req: Request, res: Response): Promise<undefined>;
    createTransaction(req: Request, res: Response): Promise<undefined>;
    updateTransaction(req: Request, res: Response): Promise<undefined>;
    deleteTransaction(req: Request, res: Response): Promise<undefined>;
};
