import { sendOTP } from "../utils/msg91.js";

export const sendOtpController = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ status: "error", message: "Invalid mobile" });
  }

  try {
    const data = await sendOTP(mobile);
    console.log("🚀 ~ sendOtpController ~ data:", data)
    return res.status(200).json({ status: "success", message: "OTP sent" });
  } catch (err) {
    return res.status(400).json({ status: "error", message: "Invalid mobile" });
  }
};

export const verifyOtpController = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ status: "error", message: "Invalid OTP" });
  }

  try {
    const result = await verifyOTP(mobile, otp);
    if (result?.message === "OTP verified success") {
      return res
        .status(200)
        .json({ status: "success", message: "OTP verified" });
    } else {
      return res.status(400).json({ status: "error", message: "Invalid OTP" });
    }
  } catch (err) {
    return res.status(400).json({ status: "error", message: "Invalid OTP" });
  }
};
