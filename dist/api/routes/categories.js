"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categoryController_1 = require("../controllers/categoryController");
const express_2 = require("supertokens-node/recipe/session/framework/express");
const validators_1 = require("../../utils/validators");
const router = express_1.default.Router();
// Apply authentication middleware to all category routes
router.use((0, express_2.verifySession)());
// Category routes
router.get('/', categoryController_1.categoryController.getCategories);
router.post('/', (0, validators_1.validate)(validators_1.schemas.category.create), categoryController_1.categoryController.createCategory);
router.put('/:id', (0, validators_1.validate)(validators_1.schemas.category.update), categoryController_1.categoryController.updateCategory);
router.delete('/:id', categoryController_1.categoryController.deleteCategory);
// Export using ES Module syntax
exports.default = router;
