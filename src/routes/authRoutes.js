import express from "express";
import { createGuestUser } from "../controller/guestController.js";
import { registerCustomer } from "../controller/CustomerController.js";
import {
  updateUserRole,
  getVendorStatus,
} from "../controller/VendorController.js";
import {
  sendOtpController,
  verifyOtpController,
} from "../controller/sendOtpController.js";

const router = express.Router();

router.post("/auth/guest/:id", createGuestUser);
router.post("/auth/register/customer", registerCustomer);
router.post("/auth/update-role", updateUserRole);
router.get("/auth/status/:id", getVendorStatus);

router.post("/auth/send-otp", sendOtpController);
router.post("/auth/verify-otp", verifyOtpController);

export default router;
