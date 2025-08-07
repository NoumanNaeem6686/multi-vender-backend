import prisma from "../../prisma/index.js";
import { verifyOTP } from "../services/otpService.js";
import {
  validateEmail,
  validateMobile,
  validateRequiredFields,
} from "../utils/validation.js";

import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  USER_ROLES,
  USER_STATUS,
} from "../constants/validation.js";

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

  const requiredFields = [
    "deviceId",
    "firstName",
    "lastName",
    "mobile",
    "email",
    "pinCode",
    "city",
    "state",
    "address",
    "otp",
  ];
  const fieldsValidation = validateRequiredFields(req.body, requiredFields);
  if (!fieldsValidation.isValid) {
    return res.status(400).json({
      status: "error",
      message: fieldsValidation.message,
    });
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return res.status(400).json({
      status: "error",
      message: emailValidation.message,
    });
  }

  const mobileValidation = validateMobile(mobile);
  if (!mobileValidation.isValid) {
    return res.status(400).json({
      status: "error",
      message: mobileValidation.message,
    });
  }

  try {
    const otpResult = await verifyOTP(mobile, otp);
    if (otpResult?.message !== "OTP verified success") {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.INVALID_OTP,
      });
    }
  } catch (otpError) {
    console.error("OTP verification error:", otpError);
    return res.status(400).json({
      status: "error",
      message: ERROR_MESSAGES.INVALID_OTP,
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { deviceId },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.USER_EXISTS,
      });
    }

    const existingEmailOrMobile = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { mobile: mobile }],
      },
    });

    if (existingEmailOrMobile) {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.USER_EXISTS,
      });
    }

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
        role: USER_ROLES.CUSTOMER,
        status: USER_STATUS.APPROVED,
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: customer.id,
        role: customer.role,
      },
      message: SUCCESS_MESSAGES.CUSTOMER_REGISTERED,
    });
  } catch (error) {
    console.error("Customer registration error:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.USER_EXISTS,
      });
    }

    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};
