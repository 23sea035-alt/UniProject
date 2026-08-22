import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createPaymentSession, processWebhook, getPaymentHistory, getAllPayments } from "../services/payment.js";
import { billsCol } from "../lib/db.js";

const router: IRouter = Router();

const createPaymentSchema = z.object({
  billId: z.string(),
});

router.post("/create", requireAuth, validate(createPaymentSchema), async (req, res) => {
  try {
    const billSnap = await billsCol.doc(req.body.billId).get();
    if (!billSnap.exists) {
      res.status(404).json({ error: "Bill not found" });
      return;
    }
    const bill = billSnap.data()!;

    if (bill.userId !== req.user!.uid && req.user!.role === 'user') {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (bill.status === 'paid') {
      res.status(400).json({ error: "Bill already paid" });
      return;
    }

    const { payment, transactionId } = await createPaymentSession(
      req.body.billId,
      req.user!.uid,
      bill.totalAmount,
    );

    res.status(201).json({
      payment,
      transactionId,
      paymentUrl: `https://payment-gateway.example.com/pay/${transactionId}`,
      amount: bill.totalAmount,
      currency: "LKR",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create payment" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const signature = (req.headers["x-webhook-signature"] as string) || "";
    await processWebhook(req.body, signature);
    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ error: "Webhook processing failed" });
  }
});

router.get("/history", requireAuth, async (req, res) => {
  try {
    if (req.user!.role === 'user') {
      const payments = await getPaymentHistory(req.user!.uid);
      res.json(payments);
    } else {
      const payments = await getAllPayments();
      res.json(payments);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

export default router;
