import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import bcrypt from "bcryptjs";
import { usersCol } from "../lib/db.js";
import { requireAuth, signToken } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";

const router: IRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  nic: z.string().optional(),
  address: z.string().optional(),
  district: z.string().optional(),
  region: z.string().optional(),
});

router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { password, ...userData } = req.body;

    const existing = await usersCol.where("email", "==", userData.email).limit(1).get();
    if (!existing.empty) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRef = usersCol.doc();

    await userRef.set({
      ...userData,
      password: hashedPassword,
      role: "user",
      meterId: null,
      deviceId: null,
      status: "active",
      serviceStatus: "active",
      valveLocked: false,
      gracePeriodDays: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const token = signToken({
      userId: userRef.id,
      email: userData.email,
      role: "user",
    });

    res.status(201).json({
      token,
      user: {
        id: userRef.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: "user",
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const snap = await usersCol.where("email", "==", email).limit(1).get();
    if (snap.empty) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const doc = snap.docs[0];
    const user = doc.data();

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = signToken({
      userId: doc.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: doc.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userSnap = await usersCol.doc(req.user!.uid).get();
    if (!userSnap.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = userSnap.data()!;
    res.json({
      id: userSnap.id,
      uid: user.uid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      nic: user.nic,
      phone: user.phone,
      address: user.address,
      role: user.role,
      region: user.region,
      district: user.district,
      meterId: user.meterId,
      accountNumber: user.accountNumber,
      status: user.status,
      serviceStatus: user.serviceStatus,
      valveLocked: user.valveLocked,
      valveLockReason: user.valveLockReason,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const allowedFields = ["firstName", "lastName", "phone", "address", "district"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    await usersCol.doc(req.user!.uid).update({ ...updates, updatedAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
