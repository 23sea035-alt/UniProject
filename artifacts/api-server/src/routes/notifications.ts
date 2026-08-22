import { Router, type IRouter } from "express";

const p = (v: string | string[]) => Array.isArray(v) ? v[0] : v;
import { requireAuth } from "../middlewares/auth.js";
import { listNotifications, markAsRead, markAllAsRead, getUnreadCount } from "../services/notification.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await listNotifications(req.user!.uid);
    const unreadCount = await getUnreadCount(req.user!.uid);
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post("/:id/read", requireAuth, async (req, res) => {
  try {
    await markAsRead(p(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

router.post("/read-all", requireAuth, async (req, res) => {
  try {
    await markAllAsRead(req.user!.uid);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

export default router;
