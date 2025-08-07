import prisma from "../../prisma/index.js";
import { verifyOTP } from "../services/otpService.js";
import {
  uploadVendorProfilePhoto,
  uploadVendorCoverPhoto,
  deleteFromS3,
} from "../services/s3Service.js";
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

export const registerVendor = async (req, res) => {
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
    storeName,
    storeAddress,
    facebookUrl,
    instagramUrl,
    youtubeUrl,
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
    "storeName",
    "storeAddress",
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
      where: { email: req.body.email },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.USER_EXISTS,
      });
    }

    const vendor = await prisma.user.create({
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
        storeName,
        storeAddress,
        facebookUrl,
        instagramUrl,
        youtubeUrl,
        role: USER_ROLES.VENDOR_PENDING,
        status: USER_STATUS.PENDING,
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: vendor.id,
        role: vendor.role,
        status: vendor.status,
      },
      message: SUCCESS_MESSAGES.VENDOR_SUBMITTED,
    });
  } catch (err) {
    console.error("Vendor registration error:", err);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export const updateUserRole = async (req, res) => {
  const {
    id,
    storeName,
    storeAddress,
    facebookUrl,
    instagramUrl,
    youtubeUrl,
    otp,
  } = req.body;

  const requiredFields = ["id", "storeName", "storeAddress", "otp"];
  const fieldsValidation = validateRequiredFields(req.body, requiredFields);
  if (!fieldsValidation.isValid) {
    return res.status(400).json({
      status: "error",
      message: fieldsValidation.message,
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    if (existingUser.role !== USER_ROLES.CUSTOMER) {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.ONLY_CUSTOMERS_UPGRADE,
      });
    }

    try {
      const otpResult = await verifyOTP(existingUser.mobile, otp);
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

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        storeName,
        storeAddress,
        facebookUrl,
        instagramUrl,
        youtubeUrl,
        role: USER_ROLES.VENDOR_PENDING,
        status: USER_STATUS.PENDING,
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: updatedUser.id,
        role: updatedUser.role,
        status: updatedUser.status,
      },
      message: SUCCESS_MESSAGES.ROLE_UPDATE_SUBMITTED,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export const getVendorStatus = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: "error",
      message: ERROR_MESSAGES.REQUIRED_FIELDS,
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        id: user.id,
        role: user.role,
        status: user.status,
      },
      message: SUCCESS_MESSAGES.STATUS_RETRIEVED,
    });
  } catch (error) {
    console.error("Get vendor status error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const {
      id,
      firstName,
      lastName,
      mobile,
      email,
      pinCode,
      city,
      state,
      address,
      storeName,
      storeAddress,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.REQUIRED_FIELDS,
      });
    }

    if (!req.files?.profilePhoto || !req.files?.coverPhoto) {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.FILES_REQUIRED,
      });
    }

    const existingVendor = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    if (existingVendor.status !== USER_STATUS.LIVE) {
      return res.status(403).json({
        status: "error",
        message: ERROR_MESSAGES.APPROVAL_PENDING,
      });
    }

    if (existingVendor.role !== USER_ROLES.VENDOR) {
      return res.status(403).json({
        status: "error",
        message: "Only vendors can update vendor information",
      });
    }

    let profilePhotoUrl = null;
    let coverPhotoUrl = null;
    let uploadedFiles = [];

    try {
      if (req.files.profilePhoto) {
        const profileFile = req.files.profilePhoto[0];
        const profileResult = await uploadVendorProfilePhoto(
          profileFile.buffer,
          profileFile.originalname,
          profileFile.mimetype
        );
        profilePhotoUrl = profileResult.fileUrl;
        uploadedFiles.push({
          type: "profile",
          s3Key: profileResult.s3Key,
          url: profileResult.fileUrl,
        });
      }

      if (req.files.coverPhoto) {
        const coverFile = req.files.coverPhoto[0];
        const coverResult = await uploadVendorCoverPhoto(
          coverFile.buffer,
          coverFile.originalname,
          coverFile.mimetype
        );
        coverPhotoUrl = coverResult.fileUrl;
        uploadedFiles.push({
          type: "cover",
          s3Key: coverResult.s3Key,
          url: coverResult.fileUrl,
        });
      }
    } catch (uploadError) {
      console.error("File upload error:", uploadError);
      return res.status(400).json({
        status: "error",
        message: "File upload failed: " + uploadError.message,
      });
    }

    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (email !== undefined) updateData.email = email;
    if (pinCode !== undefined) updateData.pinCode = pinCode;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (address !== undefined) updateData.address = address;
    if (storeName !== undefined) updateData.storeName = storeName;
    if (storeAddress !== undefined) updateData.storeAddress = storeAddress;
    if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl;
    if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl;
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl;
    if (profilePhotoUrl) updateData.profilePhoto = profilePhotoUrl;
    if (coverPhotoUrl) updateData.coverPhoto = coverPhotoUrl;

    const updatedVendor = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: updatedVendor.id,
        role: updatedVendor.role,
        status: updatedVendor.status,
        profilePhoto: profilePhotoUrl,
        coverPhoto: coverPhotoUrl,
      },
      message: SUCCESS_MESSAGES.VENDOR_LIVE,
    });
  } catch (error) {
    console.error("Update Vendor Error:", error);

    if (uploadedFiles.length > 0) {
      console.log("Cleaning up uploaded files due to database error...");
      for (const file of uploadedFiles) {
        try {
          await deleteFromS3(file.s3Key);
          console.log(`Deleted file: ${file.s3Key}`);
        } catch (deleteError) {
          console.error(`Failed to delete file ${file.s3Key}:`, deleteError);
        }
      }
    }

    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};
