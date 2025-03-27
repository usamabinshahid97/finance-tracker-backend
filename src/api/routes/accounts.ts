import express from 'express';
import { accountController } from '../controllers/accountController';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { validate, schemas } from '../../utils/validators';

const router = express.Router();

// Apply authentication middleware to all account routes
router.use(verifySession());

// Account routes
router.get('/', accountController.getAccounts);
router.get('/:id', accountController.getAccount);
router.post('/', validate(schemas.account.create), accountController.createAccount);
router.put('/:id', validate(schemas.account.update), accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

// Credit card routes
router.get('/credit-cards', accountController.getCreditCards);
router.post('/credit-cards', validate(schemas.creditCard.create), accountController.createCreditCard);
router.put('/credit-cards/:id', validate(schemas.creditCard.update), accountController.updateCreditCard);
router.delete('/credit-cards/:id', accountController.deleteCreditCard);

// Export using ES Module syntax
export default router;