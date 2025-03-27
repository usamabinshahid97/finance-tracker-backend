import express from 'express';
import { categoryController } from '../controllers/categoryController';
import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import { validate, schemas } from '../../utils/validators';

const router = express.Router();

// Apply authentication middleware to all category routes
router.use(verifySession());

// Category routes
router.get('/', categoryController.getCategories);
router.post('/', validate(schemas.category.create), categoryController.createCategory);
router.put('/:id', validate(schemas.category.update), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

// Export using ES Module syntax
export default router;