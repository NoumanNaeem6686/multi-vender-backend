import axios from "axios";

const AUTH_KEY = process.env.MSG91_AUTH_KEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

export async function sendOTP(mobile) {
  const response = await axios.post(
    "https://control.msg91.com/api/v5/otp",
    {
      mobile,
      template_id: TEMPLATE_ID,
    },
    {
      headers: { authkey: AUTH_KEY, "Content-Type": "application/json" },
    }
  );
  return response.data;
}

export async function verifyOTP(mobile, otp) {
  const response = await axios.get(
    `https://control.msg91.com/api/v5/otp/verify?mobile=${mobile}&otp=${otp}`,
    {
      headers: { authkey: AUTH_KEY },
    }
  );
  return response.data;
}
