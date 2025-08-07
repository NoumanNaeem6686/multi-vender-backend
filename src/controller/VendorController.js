import prisma from "../../prisma/index.js";
import { verifyOTP } from "../services/otpService.js";
import {
  uploadVendorProfilePhoto,
  uploadVendorCoverPhoto,
  deleteFromS3,
} from "../services/s3Service.js";

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
    !storeName ||
    !storeAddress ||
    !otp
  ) {
    return res.status(400).json({
      status: "error",
      message: "All required fields must be provided",
    });
  }

  try {
    const otpResult = await verifyOTP(mobile, otp);
    if (otpResult?.message !== "OTP verified success") {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP",
      });
    }
  } catch (otpError) {
    console.error("OTP verification error:", otpError);
    return res.status(400).json({
      status: "error",
      message: "Invalid OTP",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: req.body.email },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User with this email already exists",
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
        role: "VENDOR_PENDING",
        status: "PENDING",
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: vendor.id,
        role: "vendorPending",
        status: "pending",
      },
      message: "Vendor submitted",
    });
  } catch (err) {
    console.error("Vendor registration error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
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

  if (!id || !storeName || !storeAddress || !otp) {
    return res.status(400).json({
      status: "error",
      message: "ID, storeName, storeAddress, and OTP are required",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (existingUser.role !== "CUSTOMER") {
      return res.status(400).json({
        status: "error",
        message: "Only customers can be upgraded to vendors",
      });
    }

    try {
      const otpResult = await verifyOTP(existingUser.mobile, otp);
      if (otpResult?.message !== "OTP verified success") {
        return res.status(400).json({
          status: "error",
          message: "Invalid OTP",
        });
      }
    } catch (otpError) {
      console.error("OTP verification error:", otpError);
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP",
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
        role: "VENDOR_PENDING",
        status: "PENDING",
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: updatedUser.id,
        role: "vendorPending",
        status: "pending",
      },
      message: "Role update submitted",
    });
  } catch (error) {
    console.error("Update user role error:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

export const getVendorStatus = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      status: "error",
      message: "User ID is required",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const roleMap = {
      GUEST: "guest",
      CUSTOMER: "customer",
      VENDOR_PENDING: "vendorPending",
      VENDOR: "vendor",
    };

    const statusMap = {
      PENDING: "pending",
      APPROVED: "approved",
      LIVE: "live",
    };

    return res.status(200).json({
      status: "success",
      data: {
        id: user.id,
        role: roleMap[user.role] || user.role.toLowerCase(),
        status: statusMap[user.status] || user.status.toLowerCase(),
      },
      message: "Status retrieved",
    });
  } catch (error) {
    console.error("Get vendor status error:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
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
      otherDetails,
    } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ status: "error", message: "ID is required" });
    }

    if (!req.files?.profilePhoto || !req.files?.coverPhoto) {
      return res.status(400).json({
        status: "error",
        message: "Profile photo and cover photo are required",
      });
    }

    const existingVendor = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return res.status(404).json({
        status: "error",
        message: "Vendor not found",
      });
    }

    if (existingVendor.status !== "LIVE") {
      return res.status(403).json({
        status: "error",
        message: "Approval pending",
      });
    }

    if (existingVendor.role !== "VENDOR") {
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
        role: "vendor",
        status: "live",
        profilePhoto: profilePhotoUrl,
        coverPhoto: coverPhotoUrl,
      },
      message: "Vendor live",
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
      message: "Server error",
    });
  }
};
