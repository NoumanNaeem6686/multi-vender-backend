import express from "express";
import { createGuestUser } from "../controller/guestController.js";
import { registerCustomer } from "../controller/customerController.js";
import {
  registerVendorWebPortal,
  updateUserRole,
  getVendorStatus,
} from "../controller/vendorController.js";
import {
  firebaseLogin,
  getProfile,
  logout,
} from "../controller/authController.js";
import { authenticateFirebase, requireUser } from "../middleware/auth.js";

const router = express.Router();

// Authentication endpoints (role-based, not platform-based)
router.post("/auth/login", firebaseLogin);
router.post("/auth/guest", createGuestUser);
router.post("/auth/register/customer", registerCustomer);
router.post(
  "/auth/register/vendor",
  // authenticateFirebase,
  registerVendorWebPortal
);
router.post("/auth/update-role", ...requireUser, updateUserRole);

// Common endpoints
router.get("/auth/profile", authenticateFirebase, getProfile);
router.post("/auth/logout", authenticateFirebase, logout);
router.get("/auth/status/:id", getVendorStatus);

export default router;
