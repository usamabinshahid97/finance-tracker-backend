"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transactionController_1 = require("../controllers/transactionController");
const express_2 = require("supertokens-node/recipe/session/framework/express");
const router = express_1.default.Router();
// Apply authentication middleware to all transaction routes
router.use((0, express_2.verifySession)());
// Transaction routes
router.get('/', transactionController_1.transactionController.getTransactions);
router.post('/', transactionController_1.transactionController.createTransaction);
router.put('/:id', transactionController_1.transactionController.updateTransaction);
router.delete('/:id', transactionController_1.transactionController.deleteTransaction);
// Export using ES Module syntax
exports.default = router;
