import prisma from "../../prisma/index.js";
import { validateDeviceId, validateEmail } from "../utils/validation.js";

import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  USER_ROLES,
  USER_STATUS,
} from "../constants/validation.js";

export const createGuestUser = async (req, res) => {
  const { deviceId, email } = req.body;

  const deviceValidation = validateDeviceId(deviceId);
  if (!deviceValidation.isValid) {
    return res.status(400).json({
      status: "error",
      message: deviceValidation.message,
    });
  }

  if (email) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        status: "error",
        message: emailValidation.message,
      });
    }
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { deviceId },
    });

    if (existingUser) {
      return res.status(200).json({
        status: "success",
        data: {
          id: existingUser.deviceId,
          role: existingUser.role,
        },
        message: SUCCESS_MESSAGES.GUEST_CREATED,
      });
    }

    const guest = await prisma.user.create({
      data: {
        deviceId,
        email: email || null,
        role: USER_ROLES.GUEST,
        status: USER_STATUS.PENDING,
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: guest.deviceId,
        role: guest.role,
      },
      message: SUCCESS_MESSAGES.GUEST_CREATED,
    });
  } catch (error) {
    console.error("Guest creation error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};
