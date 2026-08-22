import type { Request, Response, NextFunction } from "express";
import { metersCol } from "../lib/db.js";

export async function requireDeviceAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const deviceKey = req.headers["x-device-key"] as string | undefined;

  if (!deviceKey) {
    res.status(401).json({ error: "Missing X-Device-Key header" });
    return;
  }

  try {
    const snap = await metersCol.where("deviceId", "==", deviceKey).limit(1).get();

    if (snap.empty) {
      res.status(401).json({ error: "Invalid device key" });
      return;
    }

    const meter = snap.docs[0];
    const data = meter.data();

    req.device = {
      meterId: meter.id,
      deviceId: data.deviceId,
      userId: data.userId ?? null,
      calibrationFactor: data.calibrationFactor ?? 450,
    };

    next();
  } catch {
    res.status(500).json({ error: "Device authentication failed" });
  }
}
