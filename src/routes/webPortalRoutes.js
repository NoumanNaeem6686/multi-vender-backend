import express from "express";
import {
  updateVendor,
  approveVendor,
  getPendingVendors,
} from "../controller/vendorController.js";
import {
  createProduct,
  getVendorProducts,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  getLowStockProducts,
  getAllProducts,
  moderateProduct,
} from "../controller/productController.js";
import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "../controller/categoryController.js";
import {
  uploadVendorPhotos,
  handleUploadError,
} from "../middleware/uploadMiddleware.js";
import { requireVendor, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Vendor operations (both vendors and admins can access)
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

router.post(
  "/vendor/update",
  ...requireVendor,
  uploadVendorPhotos,
  handleUploadError,
  updateVendor
);

// Admin-only operations
router.get("/admin/vendors/pending", ...requireAdmin, getPendingVendors);
router.put("/admin/vendors/:id/approve", ...requireAdmin, approveVendor);

router.post("/admin/categories", ...requireAdmin, createCategory);
router.get("/admin/categories", ...requireAdmin, getAllCategories);
router.get("/admin/categories/:id", ...requireAdmin, getCategory);
router.put("/admin/categories/:id", ...requireAdmin, updateCategory);
router.put(
  "/admin/categories/:id/status",
  ...requireAdmin,
  toggleCategoryStatus
);
router.delete("/admin/categories/:id", ...requireAdmin, deleteCategory);

router.get("/admin/products", ...requireAdmin, getAllProducts);
router.put("/admin/products/:id/moderate", ...requireAdmin, moderateProduct);

export default router;
