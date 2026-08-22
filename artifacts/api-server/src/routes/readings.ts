import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { requireDeviceAuth } from "../middlewares/device-auth.js";
import { validate } from "../middlewares/validate.js";
import { processReading } from "../services/reading.js";
import { getNextCommand } from "../services/valve.js";

const router: IRouter = Router();

const readingSchema = z.object({
  pulseCount: z.number().int().min(0),
  flowRate: z.number().min(0).optional(),
  totalLitres: z.number().min(0).optional(),
  totalCubicMetres: z.number().min(0).optional(),
  pressure1: z.number().optional(),
  pressure2: z.number().optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  batteryVoltage: z.number().min(0).optional(),
  hydroVoltage: z.number().min(0).optional(),
  valveStatus: z.enum(["open", "closed"]).optional(),
  online: z.boolean().optional(),
  wifiSignal: z.number().int().optional(),
  uptime: z.number().optional(),
  type: z.enum(["reading", "heartbeat", "command_response"]).optional(),
  recordedAt: z.string(),
});

router.post("/", requireDeviceAuth, validate(readingSchema), async (req, res) => {
  try {
    const device = req.device!;
    const readingData = req.body;

    const reading = await processReading({
      meterId: device.meterId,
      deviceId: device.deviceId,
      pulseCount: readingData.pulseCount,
      flowRate: readingData.flowRate,
      totalLitres: readingData.totalLitres,
      totalCubicMetres: readingData.totalCubicMetres,
      pressure1: readingData.pressure1,
      pressure2: readingData.pressure2,
      batteryLevel: readingData.batteryLevel,
      batteryVoltage: readingData.batteryVoltage,
      hydroVoltage: readingData.hydroVoltage,
      valveStatus: readingData.valveStatus,
      online: readingData.online,
      wifiSignal: readingData.wifiSignal,
      type: readingData.type || 'reading',
      recordedAt: new Date(readingData.recordedAt),
      uptime: readingData.uptime,
    });

    // Return next pending command (marks it as "sent" to prevent replay)
    const pendingCommand = await getNextCommand(device.deviceId);

    res.status(201).json({
      reading: { id: reading.id },
      pendingCommand: pendingCommand ? {
        commandId: pendingCommand.id,
        action: pendingCommand.action,
        reason: pendingCommand.reason,
      } : null,
    });
  } catch (err) {
    console.error('[Readings] Error:', err);
    res.status(500).json({ error: "Failed to record reading" });
  }
});

export default router;
