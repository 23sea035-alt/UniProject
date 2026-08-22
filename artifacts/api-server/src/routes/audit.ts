import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { listAuditLogs } from "../services/audit.js";

const router: IRouter = Router();

router.get("/", requireAuth, requireRole('super_admin', 'admin', 'auditor'), async (req, res) => {
  try {
    const { userId, action, resource, limit } = req.query as Record<string, string | undefined>;
    const logs = await listAuditLogs({
      userId,
      action,
      resource,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

export default router;
