import { Request, Response } from "express";
export declare class StatementController {
    /**
     * Get all statements for the authenticated user
     */
    getStatements(req: Request, res: Response): Promise<void>;
    /**
     * Get a single statement with its processed transactions
     */
    getStatement(req: Request, res: Response): Promise<void>;
    /**
     * Upload a new statement for processing
     */
    uploadStatement(req: Request, res: Response): Promise<void>;
    /**
     * Process a statement asynchronously
     */
    private processStatementAsync;
}
declare const _default: StatementController;
export default _default;
