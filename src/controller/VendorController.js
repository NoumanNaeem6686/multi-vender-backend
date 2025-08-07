import prisma from "../../prisma/index.js";

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

  const isOtpValid = otp === "123456"; // replace with real OTP logic
  if (!isOtpValid) {
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

  // OTP validation (replace with real OTP logic)
  const isOtpValid = otp === "123456";
  if (!isOtpValid) {
    return res.status(400).json({
      status: "error",
      message: "Invalid OTP",
    });
  }

  try {
    // Find existing user
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Check if user is a customer
    if (existingUser.role !== "CUSTOMER") {
      return res.status(400).json({
        status: "error",
        message: "Only customers can be upgraded to vendors",
      });
    }

    // Update user role to vendor pending
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

    // Convert role enum to lowercase string for response
    const roleMap = {
      GUEST: "guest",
      CUSTOMER: "customer",
      VENDOR_PENDING: "vendorPending",
      VENDOR: "vendor",
    };

    // Convert status enum to lowercase string for response
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
    } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ status: "error", message: "ID is required" });
    }

    // First, check if the vendor exists and get their current status
    const existingVendor = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return res.status(404).json({
        status: "error",
        message: "Vendor not found",
      });
    }

    // Check if vendor is LIVE before allowing updates
    if (existingVendor.status !== "LIVE") {
      return res.status(403).json({
        status: "error",
        message:
          "You are not live. Please ask your admin to approve your account, then you can update your information.",
        data: {
          currentStatus: existingVendor.status,
          currentRole: existingVendor.role,
        },
      });
    }

    // Check if user is actually a vendor
    if (existingVendor.role !== "VENDOR") {
      return res.status(403).json({
        status: "error",
        message: "Only vendors can update vendor information",
      });
    }

    const profilePhotoFile = req.files?.profilePhoto?.[0] || null;
    const coverPhotoFile = req.files?.coverPhoto?.[0] || null;

    // Fallback dummy URLs or skip updates if files not uploaded
    const profilePhoto = profilePhotoFile
      ? `/uploads/${profilePhotoFile.filename}`
      : undefined;
    const coverPhoto = coverPhotoFile
      ? `/uploads/${coverPhotoFile.filename}`
      : undefined;

    // Prepare update data with only the fields that are provided
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
    if (profilePhoto) updateData.profilePhoto = profilePhoto;
    if (coverPhoto) updateData.coverPhoto = coverPhoto;

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
        message: "Vendor information updated successfully",
      },
      message: "Vendor information updated",
    });
  } catch (error) {
    console.error("Update Vendor Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
