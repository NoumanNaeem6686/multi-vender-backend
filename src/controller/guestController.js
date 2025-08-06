import prisma from "../../prisma/index.js";

export const createGuestUser = async (req, res) => {
  const { id: deviceId } = req.params;

  if (!deviceId) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid deviceId" });
  }

  try {
    const guest = await prisma.user.create({
      data: {
        deviceId,
        role: "GUEST",
      },
    });

    return res.status(200).json({
      status: "success",
      data: { deviceId: guest.deviceId, role: "guest" },
      message: "Guest created",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};
