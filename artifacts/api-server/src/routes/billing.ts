import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { generateBillForMeter, getBillsForUser, getCurrentBill, getAllBills } from "../services/billing.js";
import { logAudit } from "../services/audit.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    if (req.user!.role === 'user') {
      const bills = await getBillsForUser(req.user!.uid);
      res.json(bills);
    } else {
      const bills = await getAllBills();
      res.json(bills);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

router.get("/current", requireAuth, async (req, res) => {
  try {
    const bill = await getCurrentBill(req.user!.uid);
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch current bill" });
  }
});

const generateSchema = z.object({
  meterId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
});

router.post("/generate", requireAuth, requireRole('super_admin', 'admin', 'billing_officer'), validate(generateSchema), async (req, res) => {
  try {
    const bill = await generateBillForMeter(req.body.meterId, req.body.periodStart, req.body.periodEnd);

    await logAudit({
      userId: req.user!.uid,
      userRole: req.user!.role,
      userName: req.user!.email,
      action: 'BILL_GENERATE',
      resource: 'bills',
      resourceId: bill.id,
      meterId: req.body.meterId,
      newValue: { periodStart: req.body.periodStart, periodEnd: req.body.periodEnd },
      ipAddress: req.ip,
      result: 'success',
    });

    res.status(201).json(bill);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate bill";
    res.status(400).json({ error: message });
  }
});

export default router;
