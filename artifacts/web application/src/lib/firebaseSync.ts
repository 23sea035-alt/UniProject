/**
 * Firebase Real-Time Sync Service
 *
 * Subscribes to Firestore 'users', 'bills', 'payments' collections.
 * Field mapping is tuned to the exact structure of the mobile app:
 *
 * Mobile app saves:
 *   firstName, lastName, nic, phone, email, address, district,
 *   meterId, uid, currentUnits, role, createdAt, updatedAt,
 *   sensorData: { valveStatus, flowRate, battery, wifiSignal,
 *                 online, todayUsage, pressure1, pressure2,
 *                 hydroStatus, hydroVoltage }
 */

import { WaterUser, Bill, PaymentTransaction, ValveCommand, AuditLog, NotificationRecord } from '../types';

type SetUsers         = (u: WaterUser[])                  => void;
type SetBills         = (b: Bill[])                       => void;
type SetPayments      = (p: PaymentTransaction[])         => void;
type SetValveCommands = (v: ValveCommand[])               => void;
type SetAuditLogs     = (a: AuditLog[])                   => void;
type SetNotifications = (n: NotificationRecord[])         => void;

function toISO(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (typeof v === 'string') return v;
  if (typeof (v as Record<string,unknown>).toDate === 'function')
    return (v as { toDate: () => Date }).toDate().toISOString();
  if (typeof (v as Record<string,unknown>).seconds === 'number')
    return new Date((v as { seconds: number }).seconds * 1000).toISOString();
  return new Date().toISOString();
}

export function subscribeToFirestore(
  setUsers: SetUsers,
  setBills: SetBills,
  setPayments: SetPayments,
  setValveCommands: SetValveCommands,
  setAuditLogs: SetAuditLogs,
  setNotifications: SetNotifications,
): () => void {
  const unsubs: Array<() => void> = [];

  const connect = async () => {
    try {
      const { db } = await import('./firebase');
      const { collection, onSnapshot } = await import('firebase/firestore');

      if (!db) {
        console.warn('[FirebaseSync] Firestore not initialised — using mock data.');
        return;
      }

      // ── USERS ──────────────────────────────────────────────────────────
      // NOTE: No orderBy() — avoids needing Firestore composite index.
      // Sort in JS after mapping.
      const unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          if (snapshot.empty) {
            console.info('[FirebaseSync] users collection empty — keeping mock data.');
            return;
          }

          const mapped: WaterUser[] = [];

          for (const doc of snapshot.docs) {
            const d    = doc.data();
            const role = (d.role || '').toLowerCase();

            // Skip government / admin accounts — only show customers
            if (role === 'government' || role === 'admin' || role === 'officer') continue;

            // sensorData nested object written by API server on each reading
            const sensor: Record<string, unknown> = d.sensorData || {};

            // Valve status: mobile app / API writes "Closed" / "Open"
            const rawValve = String(sensor.valveStatus || '').toLowerCase();
            const valveStatus: WaterUser['valveStatus'] = rawValve === 'closed' ? 'CLOSED' : 'OPEN';

            // Device online status
            const espStatus: WaterUser['espStatus'] = sensor.online === true ? 'ONLINE' : 'OFFLINE';

            // Full name from firstName + lastName
            const fullName =
              [d.firstName, d.lastName].filter(Boolean).join(' ').trim() ||
              d.fullName || d.name || 'Unknown Customer';

            // currentUnits is in m³ — convert to liters for portal
            const unitsM3      = Number(d.currentUnits   || 0);
            const todayUsageM3 = Number(sensor.todayUsage || 0);

            // Determine bill status from valve / service status
            let billStatus: WaterUser['billStatus'] = 'PENDING';
            if (d.serviceStatus === 'payment_restricted' || valveStatus === 'CLOSED') {
              billStatus = 'RED_BILL';
            } else if (d.serviceStatus === 'grace_period') {
              billStatus = 'OVERDUE';
            }

            mapped.push({
              id:               doc.id,
              customerId:       d.uid || doc.id,
              fullName,
              nic:              d.nic        || '',
              phone:            d.phone      || d.phoneNumber || '',
              email:            d.email      || '',
              address:          d.address    || '',
              district:         d.district   || 'Colombo',
              province:         d.province   || 'Western',
              connectionNumber: d.meterId    || doc.id,
              meterId:          d.meterId    || '',
              esp32DeviceId:    d.deviceId   || d.meterId || doc.id,
              installationDate: toISO(d.createdAt),
              status:           d.serviceStatus === 'payment_restricted' ? 'DISCONNECTED' : 'ACTIVE',
              tariffCategory:   (d.tariffCategory || 'DOMESTIC') as WaterUser['tariffCategory'],
              valveStatus,
              espStatus,
              currentConsumptionLiters: unitsM3 * 1000,
              currentMonthUsageLiters:  todayUsageM3 * 1000,
              currentBillAmount:  Number(d.currentBillAmount  || d.currentBill || 0),
              outstandingBalance: Number(d.outstandingBalance  || 0),
              billStatus,
              lastReadingDate:  toISO(d.updatedAt || d.lastSync),
              lastPaymentDate:  d.lastPaymentDate ? toISO(d.lastPaymentDate) : undefined,
              coordinates:      d.coordinates || d.location || undefined,
            });
          }

          // Sort by createdAt descending (newest first)
          mapped.sort((a, b) => {
            const aTime = new Date(a.installationDate).getTime();
            const bTime = new Date(b.installationDate).getTime();
            return bTime - aTime;
          });

          setUsers(mapped);
          console.info(`[FirebaseSync] ✅ ${mapped.length} customers synced from Firestore`);
        },
        (err) => console.warn('[FirebaseSync] users listener error:', err.message),
      );
      unsubs.push(unsubUsers);

      // ── BILLS ──────────────────────────────────────────────────────────
      const unsubBills = onSnapshot(
        collection(db, 'bills'),
        (snapshot) => {
          if (snapshot.empty) return;
          const mapped = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id:               doc.id,
              userId:           d.userId     || d.customerId || '',
              customerId:       d.customerId || d.accountNumber || '',
              customerName:     d.customerName || d.fullName || d.name || '',
              connectionNumber: d.connectionNumber || d.meterId || '',
              billingPeriod:    d.billingPeriod    || '',
              previousReading:  Number(d.previousReading  || 0),
              currentReading:   Number(d.currentReading   || 0),
              consumptionM3:    Number(d.consumptionCubicMetres || d.consumptionM3 || d.consumption || 0),
              fixedCharge:      Number(d.fixedCharge      || 0),
              volumetricCharge: Number(d.volumetricCharge || d.variableCharge || 0),
              taxAmount:        Number(d.taxAmount        || d.systemLevy || 0),
              totalAmount:      Number(d.totalAmount      || d.amount || 0),
              status:           (d.status || d.paymentStatus || 'PENDING').toUpperCase(),
              dueDate:          toISO(d.dueDate),
              generatedDate:    toISO(d.generatedDate || d.createdAt),
              paidDate:         d.paidDate ? toISO(d.paidDate) : undefined,
              paidAmount:       Number(d.paidAmount || 0),
              district:         d.district || '',
              tariffCategory:   d.tariffCategory || 'DOMESTIC',
              slabBreakdown:    d.slabBreakdown   || [],
            } as Bill;
          });
          setBills(mapped);
          console.info(`[FirebaseSync] ✅ ${mapped.length} bills synced from Firestore`);
        },
        (err) => console.warn('[FirebaseSync] bills listener error:', err.message),
      );
      unsubs.push(unsubBills);

      // ── PAYMENTS ───────────────────────────────────────────────────────
      const unsubPayments = onSnapshot(
        collection(db, 'payments'),
        (snapshot) => {
          if (snapshot.empty) return;
          const mapped = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id:                   doc.id,
              billId:               d.billId    || d.bill_id    || '',
              userId:               d.userId    || d.customerId || '',
              customerId:           d.customerId || '',
              customerName:         d.customerName || d.name || '',
              amount:               Number(d.amount || 0),
              paymentMethod:        d.paymentMethod || d.method || d.payment_method || 'CASH',
              transactionReference: d.transactionReference || d.transactionId || d.reference || doc.id,
              paymentDate:          toISO(d.paymentDate || d.createdAt),
              receivedBy:           d.receivedBy || 'Mobile App',
              receiptNumber:        d.receiptNumber || `RCPT-${doc.id.slice(0, 8).toUpperCase()}`,
              status:               (d.status || 'VERIFIED').toUpperCase(),
              notes:                d.notes || '',
            } as PaymentTransaction;
          });
          setPayments(mapped);
          console.info(`[FirebaseSync] ✅ ${mapped.length} payments synced from Firestore`);
        },
        (err) => console.warn('[FirebaseSync] payments listener error:', err.message),
      );
      unsubs.push(unsubPayments);

      // ── VALVE COMMANDS ───────────────────────────────────────────────
      const unsubValveCommands = onSnapshot(
        collection(db, 'valveCommands'),
        (snapshot) => {
          const mapped: ValveCommand[] = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id:                     doc.id,
              deviceId:               d.deviceId  || d.meterId || '',
              meterId:                d.meterId   || '',
              userId:                 d.userId    || '',
              customerName:           d.customerName || d.userName || '',
              connectionNumber:       d.connectionNumber || d.meterId || '',
              commandType:            (d.action === 'close' ? 'CLOSE_VALVE' : 'OPEN_VALVE') as ValveCommand['commandType'],
              requestedByOfficerId:   d.requestedBy || d.requestedByOfficerId || 'system',
              requestedByOfficerName: d.requestedByName || d.requestedByOfficerName || 'System',
              reason:                 d.reasonNote || d.reason || '',
              timestamp:              toISO(d.createdAt),
              status:                 (d.status || 'PENDING').toUpperCase() as ValveCommand['status'],
              supervisorApproved:     d.supervisorApproved || d.reason === 'overdue_bill',
              esp32AckTimestamp:      d.acknowledgedAt ? toISO(d.acknowledgedAt) : undefined,
              completedTimestamp:     d.executedAt ? toISO(d.executedAt) : undefined,
            } as ValveCommand;
          });
          mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setValveCommands(mapped);
          console.info(`[FirebaseSync] ✅ ${mapped.length} valve commands synced`);
        },
        (err) => console.warn('[FirebaseSync] valveCommands listener error:', err.message),
      );
      unsubs.push(unsubValveCommands);

      // ── AUDIT LOGS ──────────────────────────────────────────────────
      const unsubAuditLogs = onSnapshot(
        collection(db, 'auditLogs'),
        (snapshot) => {
          const mapped: AuditLog[] = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id:             doc.id,
              officerId:      d.userId    || d.officerId || '',
              officerName:    d.userName  || d.officerName || 'System',
              officerRole:    d.userRole  || d.officerRole || 'SUPER_ADMIN',
              action:         d.action    || '',
              actionCategory: (d.actionCategory || 'SYSTEM') as AuditLog['actionCategory'],
              targetEntity:   d.resource  || d.targetEntity || '',
              targetId:       d.resourceId || d.targetId || '',
              previousValue:  typeof d.previousValue === 'string' ? d.previousValue : JSON.stringify(d.previousValue || ''),
              newValue:       typeof d.newValue === 'string' ? d.newValue : JSON.stringify(d.newValue || ''),
              ipAddress:      d.ipAddress || '127.0.0.1',
              timestamp:      toISO(d.createdAt),
              status:         (d.result === 'success' ? 'SUCCESS' : d.result === 'failure' ? 'FAILURE' : 'SUCCESS') as AuditLog['status'],
              details:        d.details || '',
            } as AuditLog;
          });
          mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setAuditLogs(mapped);
          console.info(`[FirebaseSync] ✅ ${mapped.length} audit logs synced`);
        },
        (err) => console.warn('[FirebaseSync] auditLogs listener error:', err.message),
      );
      unsubs.push(unsubAuditLogs);

      // ── NOTIFICATIONS ───────────────────────────────────────────────
      const unsubNotifications = onSnapshot(
        collection(db, 'notifications'),
        (snapshot) => {
          const mapped: NotificationRecord[] = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id:                    doc.id,
              recipientCustomerId:   d.userId    || d.recipientCustomerId || '',
              recipientName:         d.recipientName || '',
              recipientPhone:        d.recipientPhone || '',
              type:                  (d.type || 'SYSTEM_ALERT') as NotificationRecord['type'],
              channel:               (d.channel || 'BOTH') as NotificationRecord['channel'],
              title:                 d.title     || '',
              message:               d.message   || '',
              sentTimestamp:         toISO(d.createdAt || d.sentAt),
              deliveryStatus:        (d.status || 'SENT').toUpperCase() as NotificationRecord['deliveryStatus'],
              gatewayProvider:       d.gatewayProvider || 'NWSDB-SMS',
            } as NotificationRecord;
          });
          mapped.sort((a, b) => new Date(b.sentTimestamp).getTime() - new Date(a.sentTimestamp).getTime());
          setNotifications(mapped);
          console.info(`[FirebaseSync] ✅ ${mapped.length} notifications synced`);
        },
        (err) => console.warn('[FirebaseSync] notifications listener error:', err.message),
      );
      unsubs.push(unsubNotifications);

    } catch (err) {
      console.warn('[FirebaseSync] Connection failed — using demo data:', err);
    }
  };

  connect();
  return () => unsubs.forEach((u) => u());
}
