import express from "express";
import { registerCustomer } from "../controller/CustomerController.js";

const router = express.Router();

router.post("/auth/register/customer", registerCustomer);

export default router;
