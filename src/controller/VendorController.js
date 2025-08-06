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

export const updateVendor = async (req, res) => {
  try {
    const { id, otherDetails } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ status: "error", message: "ID is required" });
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

    const updatedVendor = await prisma.user.update({
      where: { id },
      data: {
        ...(profilePhoto && { profilePhoto }),
        ...(coverPhoto && { coverPhoto }),
        ...(otherDetails ? JSON.parse(otherDetails) : {}),
        role: "VENDOR",
        status: "LIVE",
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: updatedVendor.id,
        role: updatedVendor.role,
        status: updatedVendor.status,
      },
      message: "Vendor live",
    });
  } catch (error) {
    console.error("Update Vendor Error:", error);
    return res.status(400).json({
      status: "error",
      message: "Invalid data",
    });
  }
};
