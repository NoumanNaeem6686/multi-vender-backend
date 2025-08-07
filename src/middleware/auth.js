import admin from "../config/firebase.js";
import prisma from "../../prisma/index.js";
import { USER_ROLES } from "../constants/validation.js";

export const authenticateFirebase = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found. Please complete registration.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Account is deactivated",
      });
    }

    req.user = user;
    req.firebaseToken = decodedToken;

    next();
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        status: "error",
        message: "Token expired. Please login again.",
      });
    }

    return res.status(401).json({
      status: "error",
      message: "Invalid authentication token",
    });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    // Convert single role to array for consistent checking
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Insufficient permissions",
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};

export const requireAuth = authenticateFirebase;

export const requireCustomer = [
  authenticateFirebase,
  requireRole([USER_ROLES.CUSTOMER, USER_ROLES.VENDOR, USER_ROLES.ADMIN]),
];

export const requireVendor = [
  authenticateFirebase,
  requireRole([USER_ROLES.VENDOR, USER_ROLES.ADMIN]),
];

export const requireAdmin = [
  authenticateFirebase,
  requireRole([USER_ROLES.ADMIN]),
];

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    req.user = user;
    req.firebaseToken = decodedToken;

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};
