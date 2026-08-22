import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { listCustomers, getCustomer, updateCustomer, suspendCustomer, activateCustomer, assignMeter } from "../services/customer.js";
import { logAudit } from "../services/audit.js";

const p = (v: string | string[]) => Array.isArray(v) ? v[0] : v;

const router: IRouter = Router();

router.get("/", requireAuth, requireRole('super_admin', 'admin', 'regional_manager', 'district_officer', 'billing_officer', 'customer_service'), async (req, res) => {
  try {
    const { region, district, status } = req.query as Record<string, string | undefined>;
    const customers = await listCustomers({ region, district, status });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

router.get("/:uid", requireAuth, async (req, res) => {
  try {
    const customer = await getCustomer(p(req.params.uid));
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    if (req.user!.role === 'user' && req.user!.uid !== p(req.params.uid)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

router.patch("/:uid", requireAuth, async (req, res) => {
  try {
    if (req.user!.role === 'user' && req.user!.uid !== p(req.params.uid)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    await updateCustomer(p(req.params.uid), req.body);

    await logAudit({
      userId: req.user!.uid,
      userRole: req.user!.role,
      userName: req.user!.email,
      action: 'CUSTOMER_UPDATE',
      resource: 'users',
      resourceId: p(req.params.uid),
      customerId: p(req.params.uid),
      newValue: req.body,
      ipAddress: req.ip,
      result: 'success',
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update customer" });
  }
});

router.post("/:uid/suspend", requireAuth, requireRole('super_admin', 'admin', 'regional_manager'), async (req, res) => {
  try {
    await suspendCustomer(p(req.params.uid), req.body.reason || 'Suspended by government');

    await logAudit({
      userId: req.user!.uid,
      userRole: req.user!.role,
      userName: req.user!.email,
      action: 'CUSTOMER_SUSPEND',
      resource: 'users',
      resourceId: p(req.params.uid),
      customerId: p(req.params.uid),
      newValue: { status: 'suspended' },
      reason: req.body.reason,
      ipAddress: req.ip,
      result: 'success',
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to suspend customer" });
  }
});

router.post("/:uid/activate", requireAuth, requireRole('super_admin', 'admin', 'regional_manager'), async (req, res) => {
  try {
    await activateCustomer(p(req.params.uid));

    await logAudit({
      userId: req.user!.uid,
      userRole: req.user!.role,
      userName: req.user!.email,
      action: 'CUSTOMER_ACTIVATE',
      resource: 'users',
      resourceId: p(req.params.uid),
      customerId: p(req.params.uid),
      newValue: { status: 'active' },
      ipAddress: req.ip,
      result: 'success',
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to activate customer" });
  }
});

router.post("/:uid/assign-meter", requireAuth, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { meterId } = req.body;
    await assignMeter(p(req.params.uid), meterId);

    await logAudit({
      userId: req.user!.uid,
      userRole: req.user!.role,
      userName: req.user!.email,
      action: 'METER_ASSIGN',
      resource: 'meters',
      resourceId: meterId,
      customerId: p(req.params.uid),
      newValue: { meterId },
      ipAddress: req.ip,
      result: 'success',
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to assign meter" });
  }
});

export default router;
