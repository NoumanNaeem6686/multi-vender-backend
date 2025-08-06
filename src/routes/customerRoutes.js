import express from "express";
import { registerCustomer } from "../controller/registerCustomerController.js";

const router = express.Router();

router.post("/auth/register/customer", registerCustomer);

export default router;
