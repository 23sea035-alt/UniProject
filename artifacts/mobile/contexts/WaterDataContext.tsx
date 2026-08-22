import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { valveApi, billApi, meterApi } from '@/lib/api';

export interface SensorData {
  flowRate: number;
  pressure1: number;
  pressure2: number;
  battery: number;
  hydroVoltage: number;
  hydroStatus: 'Active' | 'Inactive';
  valveStatus: 'Open' | 'Closed';
  totalUnits: number;
  todayUsage: number;
  online: boolean;
  lastSync: Date;
  wifiSignal: number;
}

export interface DailyUsage { day: number; usage: number; }
export interface MonthlyUsage { month: string; usage: number; }

export interface BillInfo {
  units: number;
  tierBreakdown: { tier: string; units: number; rate: number; amount: number }[];
  variableCharge: number;
  fixedCharge: number;
  systemLevy: number;
  stampDuty: number;
  total: number;
  status: 'green' | 'orange' | 'red';
  dueDate: string;
}

export interface MockUser {
  uid: string;
  firstName: string;
  lastName: string;
  nic: string;
  phone: string;
  meterId: string;
  address: string;
  currentUnits: number;
  currentBill: number;
  valveStatus: 'Open' | 'Closed';
  battery: number;
  online: boolean;
  billStatus: 'green' | 'orange' | 'red';
  district: string;
  flowRate: number;
  pressure1: number;
  pressure2: number;
}

export interface SystemStats {
  totalUsers: number;
  onlineDevices: number;
  offlineDevices: number;
  dailyUsage: number;
  monthlyUsage: number;
  totalRevenue: number;
  leakAlerts: number;
  lowBatteryDevices: number;
  redBillAlerts: number;
  pressureAlerts: number;
}

interface WaterDataState {
  sensorData: SensorData;
  billInfo: BillInfo;
  dailyUsage: DailyUsage[];
  monthlyUsage: MonthlyUsage[];
  systemStats: SystemStats;
  mockUsers: MockUser[];
  valveLocked: boolean;
  valveLockReason: string;
  requestValveAction: (action: 'open' | 'close') => Promise<{ success: boolean; message?: string; denialReason?: string }>;
  valveLoading: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEFAULT_SENSOR: SensorData = {
  flowRate: 0, pressure1: 0, pressure2: 0, battery: 0,
  hydroVoltage: 0, hydroStatus: 'Inactive', valveStatus: 'Closed',
  totalUnits: 0, todayUsage: 0, online: false, lastSync: new Date(), wifiSignal: 0,
};

const FALLBACK_SENSOR: SensorData = {
  flowRate: 12.4, pressure1: 2.35, pressure2: 2.18, battery: 85,
  hydroVoltage: 5.2, hydroStatus: 'Active', valveStatus: 'Open',
  totalUnits: 14.5, todayUsage: 0.82, online: true, lastSync: new Date(), wifiSignal: -62,
};

const FALLBACK_DAILY: DailyUsage[] = Array.from({ length: 18 }, (_, i) => ({
  day: i + 1,
  usage: parseFloat((0.3 + Math.random() * 0.9).toFixed(2)),
}));

const FALLBACK_MONTHLY: MonthlyUsage[] = [
  { month: 'Jan', usage: 11.2 },
  { month: 'Feb', usage: 9.8 },
  { month: 'Mar', usage: 13.5 },
  { month: 'Apr', usage: 10.1 },
  { month: 'May', usage: 12.7 },
  { month: 'Jun', usage: 8.9 },
  { month: 'Jul', usage: 14.3 },
  { month: 'Aug', usage: 14.5 },
];

const FALLBACK_USERS: MockUser[] = [
  { uid: '1', firstName: 'Kasun', lastName: 'Perera', nic: '199512345678', phone: '0771234567', meterId: 'WM-2024-COL-0042', address: '42/A, Galle Road, Colombo 3', currentUnits: 14.5, currentBill: 1300, valveStatus: 'Open', battery: 85, online: true, billStatus: 'orange', district: 'Colombo', flowRate: 12.4, pressure1: 2.35, pressure2: 2.18 },
  { uid: '2', firstName: 'Malini', lastName: 'Fernando', nic: '198034567890', phone: '0761234567', meterId: 'WM-2024-GAL-0017', address: '15, Lighthouse Street, Galle Fort', currentUnits: 6.2, currentBill: 590, valveStatus: 'Open', battery: 72, online: true, billStatus: 'green', district: 'Galle', flowRate: 8.1, pressure1: 2.55, pressure2: 2.42 },
  { uid: '3', firstName: 'Ruwan', lastName: 'Jayawardena', nic: '197823456789', phone: '0751234567', meterId: 'WM-2024-KAN-0033', address: '8, Peradeniya Road, Kandy', currentUnits: 32.1, currentBill: 3200, valveStatus: 'Closed', battery: 23, online: false, billStatus: 'red', district: 'Kandy', flowRate: 0, pressure1: 0, pressure2: 0 },
  { uid: '4', firstName: 'Priyanka', lastName: 'Dissanayake', nic: '199645678901', phone: '0712345678', meterId: 'WM-2024-NEG-0008', address: '23, Beach Road, Negombo', currentUnits: 18.3, currentBill: 1650, valveStatus: 'Open', battery: 91, online: true, billStatus: 'orange', district: 'Negombo', flowRate: 10.8, pressure1: 2.65, pressure2: 2.51 },
  { uid: '5', firstName: 'Tharaka', lastName: 'Bandara', nic: '200012345678', phone: '0701234567', meterId: 'WM-2024-MAT-0025', address: '5, Temple Road, Matara', currentUnits: 8.7, currentBill: 780, valveStatus: 'Open', battery: 67, online: true, billStatus: 'green', district: 'Matara', flowRate: 6.3, pressure1: 2.45, pressure2: 2.38 },
];

let setMockUsersRef: React.Dispatch<React.SetStateAction<MockUser[]>> | null = null;

function loadFallbackUsers() {
  if (setMockUsersRef) setMockUsersRef(FALLBACK_USERS);
}

function calculateBill(units: number): BillInfo {
  const tiers = [
    { tier: '0 – 5 m³', max: 5, rate: 15 },
    { tier: '6 – 10 m³', max: 5, rate: 42 },
    { tier: '11 – 25 m³', max: 15, rate: 60 },
    { tier: '> 25 m³', max: Infinity, rate: 75 },
  ];
  let remaining = units;
  let variableCharge = 0;
  const tierBreakdown: BillInfo['tierBreakdown'] = [];
  for (const t of tiers) {
    if (remaining <= 0) break;
    const used = Math.min(remaining, t.max);
    const amount = parseFloat((used * t.rate).toFixed(2));
    if (used > 0) tierBreakdown.push({ tier: t.tier, units: parseFloat(used.toFixed(2)), rate: t.rate, amount });
    variableCharge += amount;
    remaining -= used;
  }
  const fixedCharge = 250;
  const systemLevy = 50;
  const stampDuty = 25;
  const total = parseFloat((variableCharge + fixedCharge + systemLevy + stampDuty).toFixed(2));
  const status: BillInfo['status'] = total < 1000 ? 'green' : total < 2500 ? 'orange' : 'red';
  const now = new Date();
  const due = new Date(now.getFullYear(), now.getMonth() + 1, 20);
  const dueDate = `${due.getDate()} ${MONTHS[due.getMonth()]} ${due.getFullYear()}`;
  return { units, tierBreakdown, variableCharge, fixedCharge, systemLevy, stampDuty, total, status, dueDate };
}

const WaterDataContext = createContext<WaterDataState | undefined>(undefined);

export function WaterDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<SensorData>(DEFAULT_SENSOR);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage[]>([]);
  const [mockUsers, setMockUsers] = useState<MockUser[]>([]);
  const [valveLocked, setValveLocked] = useState(false);
  const [valveLockReason, setValveLockReason] = useState('');
  const [valveLoading, setValveLoading] = useState(false);

  setMockUsersRef = setMockUsers;

  useEffect(() => {
    if (!user) {
      setSensorData(DEFAULT_SENSOR);
      setDailyUsage([]);
      setMonthlyUsage([]);
      setMockUsers([]);
      return;
    }

    const unsubs: (() => void)[] = [];
    let gotSensorData = false;

    if (user.role === 'government') {
      try {
        const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
          const users: MockUser[] = [];

          snapshot.forEach((d) => {
            const data = d.data();
            if (data.role === 'government') return;
            const sensor = data.sensorData || {};
            const units = data.currentUnits || 0;
            const bill = calculateBill(units);

            users.push({
              uid: d.id,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              nic: data.nic || '',
              phone: data.phone || '',
              meterId: data.meterId || '',
              address: data.address || '',
              currentUnits: units,
              currentBill: bill.total,
              valveStatus: sensor.valveStatus || 'Open',
              battery: sensor.battery || 0,
              online: sensor.online || false,
              billStatus: bill.status,
              district: data.district || '',
              flowRate: sensor.flowRate || 0,
              pressure1: sensor.pressure1 || 0,
              pressure2: sensor.pressure2 || 0,
            });
          });

          setMockUsers(users);
        }, (err) => {
          console.warn('Firestore users snapshot error:', err.message);
          loadFallbackUsers();
        });

        unsubs.push(unsub);
      } catch (e) {
        console.warn('Failed to subscribe to users:', e);
        loadFallbackUsers();
      }

      return () => unsubs.forEach(u => u());
    }

    try {
      const sensorUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (!snap.exists()) return;
        gotSensorData = true;
        const data = snap.data();
        const s = data.sensorData || {};
        setSensorData({
          flowRate: s.flowRate || 0,
          pressure1: s.pressure1 || 0,
          pressure2: s.pressure2 || 0,
          battery: s.battery || 0,
          hydroVoltage: s.hydroVoltage || 0,
          hydroStatus: s.hydroStatus || 'Inactive',
          valveStatus: s.valveStatus || 'Closed',
          totalUnits: data.currentUnits || 0,
          todayUsage: s.todayUsage || 0,
          online: s.online || false,
          lastSync: s.lastSync?.toDate?.() || new Date(),
          wifiSignal: s.wifiSignal || 0,
        });
        setValveLocked(data.valveLocked || false);
        setValveLockReason(data.valveLockReason || 'Your valve has been locked by the authorities due to an overdue bill. Please clear your dues to restore access.');
      }, (err) => {
        console.warn('Firestore sensor snapshot error:', err.message);
        if (!gotSensorData) setSensorData(FALLBACK_SENSOR);
      });

      unsubs.push(sensorUnsub);
    } catch (e) {
      console.warn('Failed to subscribe to sensor data:', e);
      setSensorData(FALLBACK_SENSOR);
    }

    try {
      const dailyUnsub = onSnapshot(
        collection(db, 'users', user.uid, 'usage', 'daily', 'entries'),
        (snapshot) => {
          const entries: DailyUsage[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            entries.push({ day: data.day || 0, usage: data.usage || 0 });
          });
          entries.sort((a, b) => a.day - b.day);
          setDailyUsage(entries.length > 0 ? entries : FALLBACK_DAILY);
        },
        (err) => {
          console.warn('Firestore daily usage error:', err.message);
          setDailyUsage(FALLBACK_DAILY);
        }
      );
      unsubs.push(dailyUnsub);
    } catch (e) {
      console.warn('Failed to subscribe to daily usage:', e);
      setDailyUsage(FALLBACK_DAILY);
    }

    try {
      const monthlyUnsub = onSnapshot(
        collection(db, 'users', user.uid, 'usage', 'monthly', 'entries'),
        (snapshot) => {
          const entries: MonthlyUsage[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            entries.push({ month: data.month || '', usage: data.usage || 0 });
          });
          setMonthlyUsage(entries.length > 0 ? entries : FALLBACK_MONTHLY);
        },
        (err) => {
          console.warn('Firestore monthly usage error:', err.message);
          setMonthlyUsage(FALLBACK_MONTHLY);
        }
      );
      unsubs.push(monthlyUnsub);
    } catch (e) {
      console.warn('Failed to subscribe to monthly usage:', e);
      setMonthlyUsage(FALLBACK_MONTHLY);
    }

    return () => unsubs.forEach(u => u());
  }, [user]);

  const billInfo = calculateBill(sensorData.totalUnits);

  const systemStats: SystemStats = {
    totalUsers: mockUsers.length,
    onlineDevices: mockUsers.filter(u => u.online).length,
    offlineDevices: mockUsers.filter(u => !u.online).length,
    dailyUsage: parseFloat(mockUsers.reduce((s, u) => s + u.currentUnits / 30, 0).toFixed(1)),
    monthlyUsage: parseFloat(mockUsers.reduce((s, u) => s + u.currentUnits, 0).toFixed(1)),
    totalRevenue: mockUsers.reduce((s, u) => s + u.currentBill, 0),
    leakAlerts: 2,
    lowBatteryDevices: mockUsers.filter(u => u.battery < 30).length,
    redBillAlerts: mockUsers.filter(u => u.billStatus === 'red').length,
    pressureAlerts: 1,
  };

  const requestValveAction = useCallback(async (action: 'open' | 'close') => {
    if (!user?.meterId) {
      return { success: false, message: 'No meter associated with this account' };
    }

    setValveLoading(true);
    try {
      const result = await valveApi.requestAction(user.meterId, action);
      return { success: true, message: result.message || `Valve ${action} request submitted` };
    } catch (err: any) {
      const msg = err.message || 'Valve action failed';
      if (msg.includes('PAYMENT_REQUIRED') || msg.includes('restricted')) {
        return { success: false, denialReason: 'PAYMENT_REQUIRED', message: 'Water service restricted due to outstanding bill. Please clear your dues to restore access.' };
      }
      return { success: false, message: msg };
    } finally {
      setValveLoading(false);
    }
  }, [user?.meterId]);

  return (
    <WaterDataContext.Provider value={{ sensorData, billInfo, dailyUsage, monthlyUsage, systemStats, mockUsers, valveLocked, valveLockReason, requestValveAction, valveLoading }}>
      {children}
    </WaterDataContext.Provider>
  );
}

export function useWaterData() {
  const ctx = useContext(WaterDataContext);
  if (!ctx) throw new Error('useWaterData must be used within WaterDataProvider');
  return ctx;
}
