import { Request, Response } from "express";
export declare const accountController: {
    getAccounts(req: Request, res: Response): Promise<undefined>;
    getAccount(req: Request, res: Response): Promise<undefined>;
    createAccount(req: Request, res: Response): Promise<undefined>;
    updateAccount(req: Request, res: Response): Promise<undefined>;
    deleteAccount(req: Request, res: Response): Promise<undefined>;
    getCreditCards(req: Request, res: Response): Promise<undefined>;
    createCreditCard(req: Request, res: Response): Promise<undefined>;
    updateCreditCard(req: Request, res: Response): Promise<undefined>;
    deleteCreditCard(req: Request, res: Response): Promise<undefined>;
};
