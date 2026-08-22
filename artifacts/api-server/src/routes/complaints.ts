import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createComplaint, assignComplaint, resolveComplaint, listComplaints } from "../services/complaint.js";

const p = (v: string | string[]) => Array.isArray(v) ? v[0] : v;
const router: IRouter = Router();

const createSchema = z.object({
  meterId: z.string().optional(),
  category: z.enum(["leakage", "billing", "meter", "valve", "water_quality", "pressure", "other"]),
  description: z.string().min(10),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

router.post("/", requireAuth, validate(createSchema), async (req, res) => {
  try {
    const complaint = await createComplaint({
      userId: req.user!.uid,
      ...req.body,
    });
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: "Failed to create complaint" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, category, priority } = req.query as Record<string, string | undefined>;
    const complaints = await listComplaints({ status, category, priority });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

router.post("/:id/assign", requireAuth, requireRole('super_admin', 'admin', 'customer_service', 'regional_manager'), async (req, res) => {
  try {
    await assignComplaint(p(req.params.id), req.body.assignedTo, req.user!.uid);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to assign complaint" });
  }
});

router.post("/:id/resolve", requireAuth, requireRole('super_admin', 'admin', 'field_officer', 'district_officer'), async (req, res) => {
  try {
    await resolveComplaint(p(req.params.id), req.body.resolution, req.user!.uid);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve complaint" });
  }
});

export default router;
