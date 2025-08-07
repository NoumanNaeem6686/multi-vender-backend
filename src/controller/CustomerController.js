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
    // Check if user already exists with this deviceId
    const existingUser = await prisma.user.findUnique({
      where: { deviceId },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message:
          "User with this device ID already exists. Please use a different device ID.",
      });
    }

    // Check if email or mobile already exists
    const existingEmailOrMobile = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { mobile: mobile }],
      },
    });

    if (existingEmailOrMobile) {
      return res.status(400).json({
        status: "error",
        message: "User with this email or mobile already exists",
      });
    }

    // Create new customer
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
        status: "APPROVED",
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: customer.id,
        deviceId: customer.deviceId,
        email: customer.email,
        role: customer.role,
      },
      message: "Customer registered successfully",
    });
  } catch (error) {
    console.error("Error registering customer:", error);

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return res.status(400).json({
        status: "error",
        message: "User with this email or mobile already exists",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
