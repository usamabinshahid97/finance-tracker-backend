interface ExtractedTransaction {
    date: string;
    description: string;
    amount: number;
    isExpense: boolean;
}
export declare class MistralService {
    private apiKey;
    private apiUrl;
    constructor();
    /**
     * Extracts text from a statement file using Mistral OCR
     */
    extractTextFromStatement(filePath: string): Promise<string>;
    /**
     * Processes extracted text to identify transactions
     */
    processExtractedText(text: string): Promise<ExtractedTransaction[]>;
    /**
     * Process a statement and create transactions
     */
    processStatement(statementId: string): Promise<boolean>;
    /**
     * Mark a statement as failed
     */
    private markStatementFailed;
    /**
     * Create transactions from extracted data
     */
    private createTransactionsFromStatement;
}
declare const _default: MistralService;
export default _default;
