import { Transaction, Category } from "@prisma/client";
interface CategoryPrediction {
    categoryId: string;
    categoryName: string;
    confidence: number;
}
export declare class ClaudeService {
    private apiKey;
    private apiUrl;
    constructor();
    /**
     * Predicts the most appropriate category for a transaction
     */
    predictCategory(transaction: Transaction, userCategories: Category[]): Promise<CategoryPrediction | null>;
    /**
     * Automatically categorizes a batch of transactions
     */
    categorizeTransactions(transactionIds: string[]): Promise<number>;
}
declare const _default: ClaudeService;
export default _default;
