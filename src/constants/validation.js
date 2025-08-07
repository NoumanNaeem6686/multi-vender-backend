export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MOBILE: /^[6-9]\d{9}$/,
  OTP: /^\d{6}$/,
};

export const ERROR_MESSAGES = {
  REQUIRED_FIELDS: "All fields are required",
  INVALID_EMAIL: "Invalid email format",
  INVALID_MOBILE: "Invalid mobile number format",
  INVALID_OTP: "Invalid OTP",
  INVALID_DEVICE_ID: "Invalid deviceId",
  USER_EXISTS: "User already exists",
  USER_NOT_FOUND: "User not found",
  ONLY_CUSTOMERS_UPGRADE: "Only customers can be upgraded to vendors",
  APPROVAL_PENDING: "Approval pending",
  SERVER_ERROR: "Server error",
  FILES_REQUIRED: "Profile photo and cover photo are required",
};

export const SUCCESS_MESSAGES = {
  GUEST_CREATED: "Guest created",
  CUSTOMER_REGISTERED: "Customer registered",
  VENDOR_SUBMITTED: "Vendor submitted",
  ROLE_UPDATE_SUBMITTED: "Role update submitted",
  OTP_SENT: "OTP sent",
  OTP_VERIFIED: "OTP verified",
  STATUS_RETRIEVED: "Status retrieved",
  VENDOR_LIVE: "Vendor live",
};

export const USER_ROLES = {
  GUEST: "GUEST",
  USER: "USER",
  CUSTOMER: "CUSTOMER",
  VENDOR_PENDING: "VENDOR_PENDING",
  VENDOR: "VENDOR",
  ADMIN: "ADMIN",
};

export const USER_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  LIVE: "LIVE",
};
