"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const statementController_1 = __importDefault(require("../controllers/statementController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const joi_1 = __importDefault(require("joi"));
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Create a temporary upload directory if it doesn't exist
        const tempDir = path_1.default.join(__dirname, "../../../temp");
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        // Generate a unique filename
        const uniqueName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
// File filter to only allow PDFs and image files
const fileFilter = (req, file, cb) => {
    // Accept PDF, JPEG, PNG files
    const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error("Only PDF, JPG, and PNG files are allowed"));
    }
};
// Configure upload limits
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
});
// Statement upload schema validation
const uploadStatementSchema = joi_1.default.object({
    accountId: joi_1.default.string().uuid().allow(null),
    creditCardId: joi_1.default.string().uuid().allow(null),
}).custom((value, helpers) => {
    if (!value.accountId && !value.creditCardId) {
        return helpers.error("custom.oneRequired");
    }
    if (value.accountId && value.creditCardId) {
        return helpers.error("custom.onlyOne");
    }
    return value;
}, "One and only one of accountId or creditCardId is required");
// Routes
router.get("/", authMiddleware_1.authenticateSession, statementController_1.default.getStatements.bind(statementController_1.default));
router.get("/:id", authMiddleware_1.authenticateSession, statementController_1.default.getStatement.bind(statementController_1.default));
router.post("/upload", authMiddleware_1.authenticateSession, upload.single("statement"), (0, validationMiddleware_1.validateRequest)({ body: uploadStatementSchema }), statementController_1.default.uploadStatement.bind(statementController_1.default));
exports.default = router;
