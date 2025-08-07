import express from "express";
import { createGuestUser } from "../controller/guestController.js";
import { registerCustomer } from "../controller/customerController.js";
import {
  updateUserRole,
  getVendorStatus,
} from "../controller/vendorController.js";
import {
  sendOtpController,
  verifyOtpController,
} from "../controller/sendOtpController.js";
import {
  firebaseLogin,
  getProfile,
  logout,
} from "../controller/authController.js";
import { authenticateFirebase, requireCustomer } from "../middleware/auth.js";

const router = express.Router();

router.post("/auth/guest", createGuestUser);
router.post("/auth/register/customer", registerCustomer);
router.post("/auth/update-role", ...requireCustomer, updateUserRole);
router.get("/auth/status/:id", getVendorStatus);

router.post("/auth/send-otp", sendOtpController);
router.post("/auth/verify-otp", verifyOtpController);

router.post("/auth/firebase/login", firebaseLogin);
router.get("/auth/profile", authenticateFirebase, getProfile);
router.post("/auth/logout", authenticateFirebase, logout);

export default router;
