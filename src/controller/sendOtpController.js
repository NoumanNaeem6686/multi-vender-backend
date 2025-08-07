import { sendOTP, verifyOTP } from "../services/otpService.js";
import { validateMobile, validateOTP } from "../utils/validation.js";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/validation.js";

export const sendOtpController = async (req, res) => {
  const { mobile } = req.body;

  try {
    await sendOTP(mobile);
    return res.status(200).json({
      status: "success",
      message: SUCCESS_MESSAGES.OTP_SENT,
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return res.status(400).json({
      status: "error",
      message: ERROR_MESSAGES.INVALID_MOBILE,
    });
  }
};

export const verifyOtpController = async (req, res) => {
  const { mobile, otp } = req.body;

  const mobileValidation = validateMobile(mobile);
  if (!mobileValidation.isValid) {
    return res.status(400).json({
      status: "error",
      message: ERROR_MESSAGES.INVALID_OTP,
    });
  }

  const otpValidation = validateOTP(otp);
  if (!otpValidation.isValid) {
    return res.status(400).json({
      status: "error",
      message: otpValidation.message,
    });
  }

  try {
    const result = await verifyOTP(mobile, otp);
    if (result?.message === "OTP verified success") {
      return res.status(200).json({
        status: "success",
        message: SUCCESS_MESSAGES.OTP_VERIFIED,
      });
    } else {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.INVALID_OTP,
      });
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(400).json({
      status: "error",
      message: ERROR_MESSAGES.INVALID_OTP,
    });
  }
};
