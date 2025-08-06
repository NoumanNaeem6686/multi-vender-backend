import express from "express";
import multer from "multer";
import {
  registerVendor,
  updateVendor,
} from "../controller/VendorController.js";

const router = express.Router();
const upload = multer();

router.post("/auth/register/vendor", registerVendor);
router.post("/auth/vendor/update", upload.none(), updateVendor);

export default router;
