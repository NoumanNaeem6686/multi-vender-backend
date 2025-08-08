import admin from "../config/firebase.js";
import prisma from "../../prisma/index.js";
import { validateEmail } from "../utils/validation.js";
import {
  ERROR_MESSAGES,
  USER_ROLES,
  USER_STATUS,
} from "../constants/validation.js";

export const firebaseLogin = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({
        status: "error",
        message: "Firebase token required in Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name, email_verified } = decodedToken;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required from Firebase account",
      });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        status: "error",
        message: emailValidation.message,
      });
    }

    let user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: email_verified || false,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        status: "success",
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
        },
        message: "Login successful",
      });
    }

    // Check if user exists by email (for migration from existing users)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Link Firebase UID to existing user
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firebaseUid: uid,
          isEmailVerified: email_verified || false,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        status: "success",
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
        },
        message: "Account linked successfully",
      });
    }

    // Create new user
    const namesParts = name ? name.split(" ") : ["", ""];
    const firstName = namesParts[0] || "";
    const lastName = namesParts.slice(1).join(" ") || "";

    user = await prisma.user.create({
      data: {
        firebaseUid: uid,
        email,
        firstName,
        lastName,
        role: USER_ROLES.USER,
        status: USER_STATUS.APPROVED,
        isEmailVerified: email_verified || false,
        isActive: true,
      },
    });

    return res.status(201).json({
      status: "success",
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
      },
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Firebase login error:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        status: "error",
        message: "Token expired. Please login again.",
      });
    }

    if (error.code === "auth/invalid-id-token") {
      return res.status(401).json({
        status: "error",
        message: "Invalid Firebase token",
      });
    }

    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.USER_EXISTS,
      });
    }

    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      status: "success",
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isActive: user.isActive,
        city: user.city,
        state: user.state,
        pinCode: user.pinCode,
        address: user.address,
        storeName: user.storeName,
        storeAddress: user.storeAddress,
        profilePhoto: user.profilePhoto,
        coverPhoto: user.coverPhoto,
        facebookUrl: user.facebookUrl,
        instagramUrl: user.instagramUrl,
        youtubeUrl: user.youtubeUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      message: "Profile retrieved successfully",
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

export const logout = async (req, res) => {
  try {
    // For Firebase, logout is handled on the frontend
    // This endpoint is for any server-side cleanup if needed

    return res.status(200).json({
      status: "success",
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};
