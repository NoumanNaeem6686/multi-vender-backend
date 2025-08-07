import express from "express";
import {
  registerVendor,
  updateVendor,
} from "../controller/vendorController.js";
import {
  uploadVendorPhotos,
  handleUploadError,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/auth/register/vendor", registerVendor);
router.post(
  "/auth/vendor/update",
  uploadVendorPhotos,
  handleUploadError,
  updateVendor
);

export default router;
