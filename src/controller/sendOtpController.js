// src/services/otpService.js
import fetch from "node-fetch";

export const sendOtp = async (mobile) => {
  const url = `http://localhost:5000/api/webhooks/msg91
${process.env.MSG91_TEMPLATE_ID}&mobile=${mobile}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authkey: process.env.MSG91_AUTHKEY, // ✅ your MSG91 auth key
    },
  });

  const data = await response.json();
  return data;
};

export const verifyOtpAccessToken = async (accessToken) => {
  const url = "http://localhost:5000/api/webhooks/msg91";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      authkey: process.env.MSG91_AUTHKEY,
      "access-token": accessToken,
    }),
  });

  const data = await response.json();
  return data;
};
