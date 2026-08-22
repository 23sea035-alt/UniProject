import { Router, type IRouter } from "express";
import { markOverdueBills, checkGracePeriods } from "../services/billing.js";

const router: IRouter = Router();

/**
 * POST /api/scheduler/run
 * Triggers the billing enforcement cycle:
 *   1. markOverdueBills  — marks bills past due date as "overdue"
 *   2. checkGracePeriods — after grace period, closes valve + notifies customer
 *
 * In production, call this from a cron job (e.g. every hour).
 * For testing, call manually: POST http://localhost:3000/api/scheduler/run
 */
router.post("/run", async (_req, res) => {
  try {
    const overdueCount = await markOverdueBills();
    const enforcement = await checkGracePeriods();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      overdueCount,
      enforcement,
    });
  } catch (err: any) {
    console.error("[Scheduler] Run failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/scheduler/status
 * Returns current billing status summary
 */
router.get("/status", async (_req, res) => {
  try {
    const { billsCol, usersCol } = await import("../lib/db.js");

    const billsSnap = await billsCol.get();
    const usersSnap = await usersCol.get();

    const statusCounts: Record<string, number> = {};
    for (const doc of billsSnap.docs) {
      const s = doc.data().status || 'unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }

    const userStatusCounts: Record<string, number> = {};
    for (const doc of usersSnap.docs) {
      const s = doc.data().serviceStatus || 'unknown';
      userStatusCounts[s] = (userStatusCounts[s] || 0) + 1;
    }

    res.json({
      bills: statusCounts,
      users: userStatusCounts,
      totalBills: billsSnap.size,
      totalUsers: usersSnap.size,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
