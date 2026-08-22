import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { usersCol, metersCol, billsCol, paymentsCol, devicesCol, systemConfigCol } from "../lib/db.js";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, requireRole('super_admin', 'admin', 'regional_manager'), async (req, res) => {
  try {
    const [usersSnap, metersSnap, billsSnap, paymentsSnap, devicesSnap] = await Promise.all([
      usersCol.where('role', '==', 'user').count().get(),
      metersCol.count().get(),
      billsCol.get(),
      paymentsCol.get(),
      devicesCol.count().get(),
    ]);

    const totalCustomers = usersSnap.data().count;
    const totalMeters = metersSnap.data().count;
    const totalDevices = devicesSnap.data().count;

    let totalBilled = 0;
    let totalCollected = 0;
    let overdueCount = 0;
    let unpaidCount = 0;

    for (const doc of billsSnap.docs) {
      const data = doc.data();
      totalBilled += data.totalAmount ?? 0;
      if (data.status === 'overdue') overdueCount++;
      if (data.status === 'issued') unpaidCount++;
    }

    for (const doc of paymentsSnap.docs) {
      const data = doc.data();
      if (data.status === 'completed') totalCollected += data.amount ?? 0;
    }

    res.json({
      customers: { total: totalCustomers },
      meters: { total: totalMeters },
      devices: { total: totalDevices },
      billing: {
        totalBilled,
        totalCollected,
        outstanding: totalBilled - totalCollected,
        overdueBills: overdueCount,
        unpaidBills: unpaidCount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

router.get("/config", requireAuth, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const snap = await systemConfigCol.get();
    const configMap: Record<string, string> = {};
    for (const doc of snap.docs) {
      configMap[doc.id] = doc.data().value;
    }
    res.json(configMap);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch config" });
  }
});

const configSchema = z.record(z.string(), z.string());
router.put("/config", requireAuth, requireRole('super_admin', 'admin'), validate(configSchema), async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await systemConfigCol.doc(key).set({ key, value, updatedAt: new Date() }, { merge: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update config" });
  }
});

router.get("/users", requireAuth, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const snap = await usersCol.orderBy("createdAt", "desc").get();
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
