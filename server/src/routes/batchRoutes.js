import { Router } from "express";
import * as batchController from "../controllers/batchController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  batchSchema,
  updateBatchSchema,
  idParamSchema,
} from "../validators/adminValidators.js";

const router = Router();

// Public list for registration dropdown and general access
router.get("/", asyncHandler(batchController.listBatches));

// Admin-only management routes
router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(batchSchema),
  asyncHandler(batchController.createBatch),
);

router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(idParamSchema, "params"),
  validate(updateBatchSchema),
  asyncHandler(batchController.updateBatch),
);

router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(idParamSchema, "params"),
  asyncHandler(batchController.deleteBatch),
);

export const batchRoutes = router;
