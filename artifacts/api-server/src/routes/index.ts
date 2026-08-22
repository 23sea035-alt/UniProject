import { Router, type IRouter } from "express";
import authRouter from "./auth.js";
import customersRouter from "./customers.js";
import metersRouter from "./meters.js";
import devicesRouter from "./devices.js";
import readingsRouter from "./readings.js";
import billingRouter from "./billing.js";
import paymentsRouter from "./payments.js";
import valveRouter from "./valve.js";
import ledRouter from "./led.js";
import notificationsRouter from "./notifications.js";
import complaintsRouter from "./complaints.js";
import auditRouter from "./audit.js";
import adminRouter from "./admin.js";
import schedulerRouter from "./scheduler.js";

const router: IRouter = Router();

// Health check
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/customers", customersRouter);
router.use("/meters", metersRouter);
router.use("/devices", devicesRouter);
router.use("/readings", readingsRouter);
router.use("/bills", billingRouter);
router.use("/payments", paymentsRouter);
router.use("/valve", valveRouter);
router.use("/led", ledRouter);
router.use("/notifications", notificationsRouter);
router.use("/complaints", complaintsRouter);
router.use("/audit-logs", auditRouter);
router.use("/admin", adminRouter);
router.use("/scheduler", schedulerRouter);

export default router;
