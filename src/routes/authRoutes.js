import express from "express";
import { createGuestUser } from "../controller/guestController.js";
import { registerCustomer } from "../controller/CustomerController.js";
import {
  sendOtpController,
  verifyOtpController,
} from "../controller/sendOtpController.js";

const router = express.Router();

router.post("/auth/guest/:id", createGuestUser);
router.post("/auth/register/customer", registerCustomer);

router.post("/auth/send-otp", sendOtpController);
router.post("/auth/verify-otp", verifyOtpController);

export default router;
