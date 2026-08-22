import { Router, type IRouter } from "express";

const p = (v: string | string[]) => Array.isArray(v) ? v[0] : v;
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { getDevice, listDevices, registerDevice } from "../services/device.js";

const router: IRouter = Router();

router.get("/", requireAuth, requireRole('super_admin', 'admin', 'regional_manager', 'iot_engineer'), async (req, res) => {
  try {
    const { status } = req.query as Record<string, string | undefined>;
    const devices = await listDevices({ status });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch devices" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const device = await getDevice(p(req.params.id));
    if (!device) {
      res.status(404).json({ error: "Device not found" });
      return;
    }
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch device" });
  }
});

router.post("/", requireAuth, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const device = await registerDevice(req.body);
    res.status(201).json(device);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to register device";
    res.status(400).json({ error: message });
  }
});

export default router;
