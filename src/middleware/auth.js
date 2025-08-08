import admin from "../config/firebase.js";
import prisma from "../../prisma/index.js";
import { USER_ROLES, USER_STATUS } from "../constants/validation.js";

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

// Role-based authentication middleware
export const requireUser = [
  authenticateFirebase,
  (req, res, next) => {
    const { role } = req.user;

    // Allow users, customers, and approved vendors
    if (
      ![USER_ROLES.USER, USER_ROLES.CUSTOMER, USER_ROLES.VENDOR].includes(role)
    ) {
      return res.status(403).json({
        status: "error",
        message: "Access denied for this role",
      });
    }

    next();
  },
];

export const requireVendor = [
  authenticateFirebase,
  (req, res, next) => {
    const { role, status } = req.user;

    // Only vendors and admins can access vendor features
    if (![USER_ROLES.VENDOR, USER_ROLES.ADMIN].includes(role)) {
      return res.status(403).json({
        status: "error",
        message: "Only vendors and administrators can access this feature",
      });
    }

    // Vendors must be approved (LIVE status)
    if (role === USER_ROLES.VENDOR && status !== USER_STATUS.LIVE) {
      return res.status(403).json({
        status: "error",
        message:
          "Vendor account not approved yet. Please wait for admin approval.",
      });
    }

    next();
  },
];

export const requireAdmin = [
  authenticateFirebase,
  (req, res, next) => {
    const { role } = req.user;

    if (role !== USER_ROLES.ADMIN) {
      return res.status(403).json({
        status: "error",
        message: "Only administrators can access this feature",
      });
    }

    next();
  },
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
