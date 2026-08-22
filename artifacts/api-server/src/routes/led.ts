import { Router, type IRouter } from "express";

const p = (v: string | string[]) => Array.isArray(v) ? v[0] : v;
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/auth.js";
import { requireDeviceAuth } from "../middlewares/device-auth.js";
import { validate } from "../middlewares/validate.js";
import { createLedCommand, getLedState, acknowledgeLedCommand } from "../services/led.js";
import { valveCommandsCol } from "../lib/db.js";

const router: IRouter = Router();

const requestSchema = z.object({
  meterId: z.string().min(1),
  action: z.enum(["on", "off"]),
});

// App -> queue LED command for the device
router.post("/request", requireAuth, validate(requestSchema), async (req, res) => {
  try {
    const command = await createLedCommand(
      req.body.meterId,
      req.body.action === "on",
      req.user!.uid,
      req.user!.uid,
    );
    res.status(201).json(command);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create LED command";
    res.status(400).json({ error: message });
  }
});

router.get("/status/:meterId", requireAuth, async (req, res) => {
  try {
    const state = await getLedState(p(req.params.meterId));
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch LED state" });
  }
});

// ESP32 polls this after boot to restore its true LED state
router.get("/state", requireDeviceAuth, async (req, res) => {
  try {
    const state = await getLedState(req.device!.meterId);
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch LED state" });
  }
});

// ESP32 polls for the next queued LED command (tiny response, reliable parsing).
// Marks the command "sent" on hand-off; the device confirms via /ack.
router.get("/poll", requireDeviceAuth, async (req, res) => {
  try {
    const deviceId = req.device!.deviceId;
    const snap = await valveCommandsCol
      .where("deviceId", "==", deviceId)
      .where("status", "in", ["pending", "sent"])
      .limit(5)
      .get();

    let next: { id: string; action: string } | null = null;
    if (!snap.empty) {
      const sorted = snap.docs.sort((a, b) =>
        (a.data().createdAt?.toMillis?.() ?? 0) - (b.data().createdAt?.toMillis?.() ?? 0)
      );
      const doc = sorted[0];
      if (doc.data().status === "pending") {
        await doc.ref.update({ status: "sent", updatedAt: new Date() });
      }
      next = { id: doc.id, action: doc.data().action };
    }

    res.json({ command: next });
  } catch (err) {
    res.status(500).json({ error: "Failed to poll LED commands" });
  }
});

const ackSchema = z.object({
  commandId: z.string().min(1),
  success: z.boolean(),
});

// ESP32 -> confirm command applied
router.post("/ack", requireDeviceAuth, validate(ackSchema), async (req, res) => {
  try {
    const updates = await acknowledgeLedCommand(req.body.commandId, req.body.success);
    res.json({ ok: true, ...updates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to acknowledge LED command";
    res.status(400).json({ error: message });
  }
});

export default router;
