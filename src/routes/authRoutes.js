import express from "express";
import { createGuestUser } from "../controller/guestController.js";
import { registerCustomer } from "../controller/CustomerController.js";

const router = express.Router();

router.post("/auth/guest/:id", createGuestUser);
router.post("/auth/register/customer", registerCustomer);       

export default router;
