import express from 'express';
import { transactionController } from '../controllers/transactionController';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';

const router = express.Router();

// Apply authentication middleware to all transaction routes
router.use(verifySession());

// Transaction routes
router.get('/', transactionController.getTransactions);
router.post('/', transactionController.createTransaction);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

// Export using ES Module syntax
export default router;