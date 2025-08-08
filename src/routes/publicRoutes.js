import express from "express";
import {
  getActiveCategories,
  getCategoryTree,
  getCategory,
} from "../controller/categoryController.js";
import {
  getPublicProducts,
  getProduct,
} from "../controller/productController.js";

const router = express.Router();

router.get("/categories", getActiveCategories);
router.get("/categories/tree", getCategoryTree);
router.get("/categories/:id", getCategory);

router.get("/products", getPublicProducts);
router.get("/products/:id", getProduct);

export default router;
