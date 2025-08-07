import express from "express";
import {
  registerVendor,
  updateVendor,
} from "../controller/vendorController.js";
import {
  createProduct,
  getVendorProducts,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  getLowStockProducts,
} from "../controller/productController.js";
import {
  uploadVendorPhotos,
  handleUploadError,
} from "../middleware/uploadMiddleware.js";
import { requireVendor } from "../middleware/auth.js";

const router = express.Router();

router.post("/auth/register/vendor", registerVendor);
router.post(
  "/auth/vendor/update",
  ...requireVendor,
  uploadVendorPhotos,
  handleUploadError,
  updateVendor
);

router.post("/vendor/products", ...requireVendor, createProduct);
router.get("/vendor/products", ...requireVendor, getVendorProducts);
router.put("/vendor/products/:id", ...requireVendor, updateProduct);
router.put(
  "/vendor/products/:id/status",
  ...requireVendor,
  updateProductStatus
);
router.delete("/vendor/products/:id", ...requireVendor, deleteProduct);
router.get("/vendor/products/low-stock", ...requireVendor, getLowStockProducts);

export default router;
