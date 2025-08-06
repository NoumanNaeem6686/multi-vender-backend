// src/controller/auth/registerCustomer.js
import prisma from "../../prisma/index.js";

export const registerCustomer = async (req, res) => {
  const {
    deviceId,
    firstName,
    lastName,
    mobile,
    email,
    pinCode,
    city,
    state,
    address,
    otp,
  } = req.body;

  // Basic input validation
  if (
    !deviceId ||
    !firstName ||
    !lastName ||
    !mobile ||
    !email ||
    !pinCode ||
    !city ||
    !state ||
    !address ||
    !otp
  ) {
    return res.status(400).json({
      status: "error",
      message: "All fields are required",
    });
  }

  // 🔐 Replace this with your actual OTP validation logic (e.g. MSG91)
  const isOtpValid = otp === "123456"; // TEMPORARY for testing
  if (!isOtpValid) {
    return res.status(400).json({
      status: "error",
      message: "Invalid OTP",
    });
  }

  try {
    // Create customer in the database
    const customer = await prisma.user.create({
      data: {
        deviceId,
        firstName,
        lastName,
        mobile,
        email,
        pinCode,
        city,
        state,
        address,
        role: "CUSTOMER",
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: customer.id,
        role: "customer",
      },
      message: "Customer registered",
    });
  } catch (error) {
    console.error("Error registering customer:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
