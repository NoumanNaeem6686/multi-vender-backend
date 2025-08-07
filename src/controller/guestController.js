import prisma from "../../prisma/index.js";

export const createGuestUser = async (req, res) => {
  const { id: deviceId } = req.params;
  const { email } = req.body || {};

  if (!deviceId) {
    return res
      .status(400)
      .json({ status: "error", message: "Device ID is required" });
  }

  try {
    // Check if user already exists with this deviceId
    const existingUser = await prisma.user.findUnique({
      where: { deviceId },
    });

    if (existingUser) {
      return res.status(200).json({
        status: "success",
        data: {
          id: existingUser.id,
          deviceId: existingUser.deviceId,
          email: existingUser.email,
          role: existingUser.role,
        },
        message: "Guest user already exists",
      });
    }

    // Create new guest user
    const guest = await prisma.user.create({
      data: {
        deviceId,
        email: email || null,
        role: "GUEST",
        status: "PENDING",
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: guest.id,
        deviceId: guest.deviceId,
        email: guest.email,
        role: guest.role,
      },
      message: "Guest user created",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};
