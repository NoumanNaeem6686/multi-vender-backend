import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "../controller/categoryController.js";
import {
  getAllProducts,
  moderateProduct,
} from "../controller/productController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

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
