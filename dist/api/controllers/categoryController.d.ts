import { Request, Response } from "express";
export declare const categoryController: {
    getCategories(req: Request, res: Response): Promise<undefined>;
    createCategory(req: Request, res: Response): Promise<undefined>;
    updateCategory(req: Request, res: Response): Promise<undefined>;
    deleteCategory(req: Request, res: Response): Promise<undefined>;
};
