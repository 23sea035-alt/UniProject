import type { Request, Response, NextFunction } from "express";
import { auth, firestore } from "../lib/firebase.js";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        role: string;
        region?: string;
        district?: string;
      };
    }
  }
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Verify Firebase ID token
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = await auth.verifyIdToken(token);

    // Fetch user profile from Firestore for role/region info
    const userDoc = await firestore
      .collection("users").doc(decoded.uid).get();

    const userData = userDoc.exists ? userDoc.data() : null;

    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      role: userData?.role || "user",
      region: userData?.region,
      district: userData?.district,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Keep signToken for backward compatibility (device auth, etc.)
export function signToken(payload: JwtPayload): string {
  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET || "aquatrack-secret-key";
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Role-based access control middleware
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

// Regional access control - officers can only see their region/district
export function requireRegionalAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  // Super admin and admin can access everything
  if (["super_admin", "admin"].includes(req.user.role)) {
    next();
    return;
  }
  // Others need region/district set
  if (!req.user.region) {
    res.status(403).json({ error: "No region assigned" });
    return;
  }
  next();
}
