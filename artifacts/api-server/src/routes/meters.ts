import { Router, type IRouter } from "express";

const p = (v: string | string[]) => Array.isArray(v) ? v[0] : v;
import { z } from "zod/v4";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { getMeter, getMeterStatus, listMeters, createMeter } from "../services/meter.js";
import { getPeriodConsumption } from "../services/consumption.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const { region, district, status } = req.query as Record<string, string | undefined>;
    const meters = await listMeters({ region, district, status });
    res.json(meters);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch meters" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const meter = await getMeter(p(req.params.id));
    if (!meter) {
      res.status(404).json({ error: "Meter not found" });
      return;
    }
    res.json(meter);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch meter" });
  }
});

router.get("/:id/status", requireAuth, async (req, res) => {
  try {
    const status = await getMeterStatus(p(req.params.id));
    if (!status) {
      res.status(404).json({ error: "Meter not found" });
      return;
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch meter status" });
  }
});

router.get("/:id/consumption", requireAuth, async (req, res) => {
  try {
    const { period, startDate } = req.query as Record<string, string | undefined>;
    const now = new Date();
    let start: Date;

    if (period === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (startDate) {
      start = new Date(startDate);
    } else {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const consumption = await getPeriodConsumption(p(req.params.id), start, now);
    res.json(consumption);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch consumption data" });
  }
});

const createMeterSchema = z.object({
  meterId: z.string().min(1),
  deviceId: z.string().min(1),
  userId: z.string().optional(),
  type: z.enum(["residential", "commercial", "industrial"]).optional(),
  region: z.string().optional(),
  district: z.string().optional(),
});

router.post("/", requireAuth, requireRole('super_admin', 'admin'), validate(createMeterSchema), async (req, res) => {
  try {
    const meter = await createMeter(req.body);
    res.status(201).json(meter);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to register meter";
    res.status(400).json({ error: message });
  }
});

export default router;
