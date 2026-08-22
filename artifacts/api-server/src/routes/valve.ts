import { Router, type IRouter } from "express";

const p = (v: string | string[]) => Array.isArray(v) ? v[0] : v;
import { z } from "zod/v4";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { requireDeviceAuth } from "../middlewares/device-auth.js";
import { validate } from "../middlewares/validate.js";
import {
  getValveState,
  createValveCommand,
  getNextCommand,
  acknowledgeCommand,
  governmentOverride,
  getCommandHistory,
} from "../services/valve.js";
import { usersCol } from "../lib/db.js";

const router: IRouter = Router();

router.get("/status/:meterId", requireAuth, async (req, res) => {
  try {
    const valveState = await getValveState(p(req.params.meterId));
    res.json(valveState);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch valve status" });
  }
});

const commandSchema = z.object({
  meterId: z.string(),
  action: z.enum(["open", "close"]),
  reason: z.string(),
  reasonNote: z.string().optional(),
});

router.post("/command", requireAuth, requireRole('super_admin', 'admin', 'regional_manager', 'district_officer'), validate(commandSchema), async (req, res) => {
  try {
    const command = await createValveCommand(
      req.body.meterId,
      req.body.action,
      req.body.reason as any,
      'manual',
      req.user!.uid,
      req.user!.uid,
      req.body.reasonNote,
    );
    res.status(201).json(command);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create valve command";
    res.status(400).json({ error: message });
  }
});

router.post("/request", requireAuth, async (req, res) => {
  try {
    const { meterId, action } = req.body;

    const userSnap = await usersCol.doc(req.user!.uid).get();
    const userData = userSnap.data();

    if (userData?.serviceStatus === 'payment_restricted' && action === 'open') {
      res.status(403).json({
        success: false,
        reason: "PAYMENT_REQUIRED",
        message: "Water service is restricted due to an outstanding bill.",
      });
      return;
    }

    const command = await createValveCommand(
      meterId,
      action,
      'manual_officer',
      'manual',
      req.user!.uid,
      req.user!.uid,
      'Customer request',
    );
    res.status(201).json(command);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process request";
    res.status(400).json({ error: message });
  }
});

router.get("/pending/:deviceId", requireDeviceAuth, async (req, res) => {
  try {
    const command = await getNextCommand(p(req.params.deviceId));
    res.json({ command: command || null });
  } catch (err) {
    console.error('[Valve] Pending error:', err);
    res.status(500).json({ error: "Failed to fetch pending commands" });
  }
});

const acknowledgeSchema = z.object({
  commandId: z.string(),
  success: z.boolean(),
  actualValveState: z.enum(["open", "closed"]).optional(),
});

router.post("/acknowledge", requireDeviceAuth, validate(acknowledgeSchema), async (req, res) => {
  try {
    const command = await acknowledgeCommand(
      req.body.commandId,
      req.body.success,
      req.body.actualValveState,
    );
    res.json({ command, acknowledged: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to acknowledge command";
    res.status(400).json({ error: message });
  }
});

router.post("/override", requireAuth, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { meterId, action, reasonNote } = req.body;
    const command = await governmentOverride(meterId, action, req.user!.uid, reasonNote);
    res.status(201).json(command);
  } catch (err) {
    res.status(500).json({ error: "Failed to override valve" });
  }
});

router.get("/history/:meterId", requireAuth, async (req, res) => {
  try {
    const history = await getCommandHistory(p(req.params.meterId));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch command history" });
  }
});

export default router;
