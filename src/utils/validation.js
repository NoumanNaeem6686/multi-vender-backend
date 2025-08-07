import {
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
} from "../constants/validation.js";

export const validateEmail = (email) => {
  if (!email || !VALIDATION_PATTERNS.EMAIL.test(email)) {
    return { isValid: false, message: ERROR_MESSAGES.INVALID_EMAIL };
  }
  return { isValid: true };
};

export const validateMobile = (mobile) => {
  if (!mobile || !VALIDATION_PATTERNS.MOBILE.test(mobile)) {
    return { isValid: false, message: ERROR_MESSAGES.INVALID_MOBILE };
  }
  return { isValid: true };
};

export const validateOTP = (otp) => {
  if (!otp || !VALIDATION_PATTERNS.OTP.test(otp)) {
    return { isValid: false, message: ERROR_MESSAGES.INVALID_OTP };
  }
  return { isValid: true };
};

export const validateDeviceId = (deviceId) => {
  if (
    !deviceId ||
    typeof deviceId !== "string" ||
    deviceId.trim().length === 0
  ) {
    return { isValid: false, message: ERROR_MESSAGES.INVALID_DEVICE_ID };
  }
  return { isValid: true };
};

export const validateRequiredFields = (fields, fieldNames) => {
  for (const fieldName of fieldNames) {
    if (!fields[fieldName]) {
      return { isValid: false, message: ERROR_MESSAGES.REQUIRED_FIELDS };
    }
  }
  return { isValid: true };
};
