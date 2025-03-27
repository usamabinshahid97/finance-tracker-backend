"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const accountController_1 = require("../controllers/accountController");
const express_2 = require("supertokens-node/recipe/session/framework/express");
const validators_1 = require("../../utils/validators");
const router = express_1.default.Router();
// Apply authentication middleware to all account routes
router.use((0, express_2.verifySession)());
// Account routes
router.get('/', accountController_1.accountController.getAccounts);
router.get('/:id', accountController_1.accountController.getAccount);
router.post('/', (0, validators_1.validate)(validators_1.schemas.account.create), accountController_1.accountController.createAccount);
router.put('/:id', (0, validators_1.validate)(validators_1.schemas.account.update), accountController_1.accountController.updateAccount);
router.delete('/:id', accountController_1.accountController.deleteAccount);
// Credit card routes
router.get('/credit-cards', accountController_1.accountController.getCreditCards);
router.post('/credit-cards', (0, validators_1.validate)(validators_1.schemas.creditCard.create), accountController_1.accountController.createCreditCard);
router.put('/credit-cards/:id', (0, validators_1.validate)(validators_1.schemas.creditCard.update), accountController_1.accountController.updateCreditCard);
router.delete('/credit-cards/:id', accountController_1.accountController.deleteCreditCard);
// Export using ES Module syntax
exports.default = router;
