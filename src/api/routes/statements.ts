import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import statementController from "../controllers/statementController";
import { authenticateSession } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validationMiddleware";
import Joi from "joi";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create a temporary upload directory if it doesn't exist
    const tempDir = path.join(__dirname, "../../../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter to only allow PDFs and image files
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept PDF, JPEG, PNG files
  const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, and PNG files are allowed"));
  }
};

// Configure upload limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Statement upload schema validation
const uploadStatementSchema = Joi.object({
  accountId: Joi.string().uuid().allow(null),
  creditCardId: Joi.string().uuid().allow(null),
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
router.get(
  "/",
  authenticateSession,
  statementController.getStatements.bind(statementController)
);

router.get(
  "/:id",
  authenticateSession,
  statementController.getStatement.bind(statementController)
);

router.post(
  "/upload",
  authenticateSession,
  upload.single("statement"),
  validateRequest({ body: uploadStatementSchema }),
  statementController.uploadStatement.bind(statementController)
);

export default router;
