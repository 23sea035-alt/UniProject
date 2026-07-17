import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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
  toggleValve: () => void;
  toggleUserValve: (uid: string) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

function generateDailyUsage(): DailyUsage[] {
  const today = new Date().getDate();
  return Array.from({ length: today }, (_, i) => ({
    day: i + 1,
    usage: parseFloat((0.3 + Math.random() * 0.9).toFixed(2)),
  }));
}

function generateMonthlyUsage(): MonthlyUsage[] {
  const currentMonth = new Date().getMonth();
  return MONTHS.map((month, i) => ({
    month,
    usage: i < currentMonth ? parseFloat((8 + Math.random() * 12).toFixed(1)) : i === currentMonth ? 14.5 : 0,
  }));
}

const MOCK_USERS: MockUser[] = [
  { uid: 'u1', firstName: 'Kasun', lastName: 'Perera', nic: '199512345678', phone: '0771234567', meterId: 'WM-COL-0042', address: 'Colombo 3', currentUnits: 14.5, currentBill: 1245, valveStatus: 'Open', battery: 85, online: true, billStatus: 'orange', district: 'Colombo', flowRate: 12.4, pressure1: 2.35, pressure2: 2.18 },
  { uid: 'u2', firstName: 'Malini', lastName: 'Fernando', nic: '198034567890', phone: '0761234567', meterId: 'WM-GAL-0017', address: 'Galle Fort', currentUnits: 6.2, currentBill: 462, valveStatus: 'Open', battery: 72, online: true, billStatus: 'green', district: 'Galle', flowRate: 8.1, pressure1: 2.55, pressure2: 2.42 },
  { uid: 'u3', firstName: 'Ruwan', lastName: 'Jayawardena', nic: '197823456789', phone: '0751234567', meterId: 'WM-KAN-0033', address: 'Kandy City', currentUnits: 32.1, currentBill: 2185, valveStatus: 'Closed', battery: 23, online: false, billStatus: 'red', district: 'Kandy', flowRate: 0, pressure1: 0, pressure2: 0 },
  { uid: 'u4', firstName: 'Priyanka', lastName: 'Dissanayake', nic: '199645678901', phone: '0712345678', meterId: 'WM-NEG-0008', address: 'Negombo', currentUnits: 18.3, currentBill: 980, valveStatus: 'Open', battery: 91, online: true, billStatus: 'green', district: 'Negombo', flowRate: 10.8, pressure1: 2.65, pressure2: 2.51 },
  { uid: 'u5', firstName: 'Tharaka', lastName: 'Bandara', nic: '200012345678', phone: '0701234567', meterId: 'WM-MAT-0025', address: 'Matara', currentUnits: 8.7, currentBill: 625, valveStatus: 'Open', battery: 67, online: true, billStatus: 'green', district: 'Matara', flowRate: 6.3, pressure1: 2.45, pressure2: 2.38 },
  { uid: 'u6', firstName: 'Samanthi', lastName: 'Rajapaksa', nic: '199234567890', phone: '0781234567', meterId: 'WM-JAF-0011', address: 'Jaffna', currentUnits: 28.4, currentBill: 1875, valveStatus: 'Open', battery: 45, online: true, billStatus: 'orange', district: 'Jaffna', flowRate: 14.2, pressure1: 2.25, pressure2: 2.1 },
  { uid: 'u7', firstName: 'Dilshan', lastName: 'Wickramasinghe', nic: '199812345678', phone: '0762345678', meterId: 'WM-KUR-0019', address: 'Kurunegala', currentUnits: 4.1, currentBill: 311, valveStatus: 'Open', battery: 88, online: true, billStatus: 'green', district: 'Kurunegala', flowRate: 5.4, pressure1: 2.72, pressure2: 2.61 },
  { uid: 'u8', firstName: 'Chamari', lastName: 'Herath', nic: '197756789012', phone: '0713456789', meterId: 'WM-RAT-0007', address: 'Ratnapura', currentUnits: 21.8, currentBill: 1420, valveStatus: 'Open', battery: 34, online: false, billStatus: 'orange', district: 'Ratnapura', flowRate: 0, pressure1: 0, pressure2: 0 },
];

const INITIAL_SENSOR: SensorData = {
  flowRate: 12.4,
  pressure1: 2.35,
  pressure2: 2.18,
  battery: 78,
  hydroVoltage: 5.2,
  hydroStatus: 'Active',
  valveStatus: 'Open',
  totalUnits: 14.5,
  todayUsage: 0.82,
  online: true,
  lastSync: new Date(),
  wifiSignal: -62,
};

const WaterDataContext = createContext<WaterDataState | undefined>(undefined);

export function WaterDataProvider({ children }: { children: ReactNode }) {
  const [sensorData, setSensorData] = useState<SensorData>(INITIAL_SENSOR);
  const [dailyUsage] = useState<DailyUsage[]>(generateDailyUsage);
  const [monthlyUsage] = useState<MonthlyUsage[]>(generateMonthlyUsage);
  const [mockUsers, setMockUsers] = useState<MockUser[]>(MOCK_USERS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(prev => ({
        ...prev,
        flowRate: parseFloat((Math.max(0, prev.flowRate + (Math.random() - 0.5) * 1.5)).toFixed(1)),
        pressure1: parseFloat((Math.max(1.5, Math.min(4, prev.pressure1 + (Math.random() - 0.5) * 0.08))).toFixed(2)),
        pressure2: parseFloat((Math.max(1.5, Math.min(4, prev.pressure2 + (Math.random() - 0.5) * 0.08))).toFixed(2)),
        battery: Math.max(10, Math.min(100, prev.battery)),
        hydroVoltage: parseFloat((Math.max(4.5, Math.min(6.5, prev.hydroVoltage + (Math.random() - 0.5) * 0.15))).toFixed(1)),
        lastSync: new Date(),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const billInfo = calculateBill(sensorData.totalUnits);

  const toggleValve = useCallback(() => {
    setSensorData(prev => ({
      ...prev,
      valveStatus: prev.valveStatus === 'Open' ? 'Closed' : 'Open',
      flowRate: prev.valveStatus === 'Open' ? 0 : 12.4,
    }));
  }, []);

  const toggleUserValve = useCallback((uid: string) => {
    setMockUsers(prev => prev.map(u =>
      u.uid === uid ? { ...u, valveStatus: u.valveStatus === 'Open' ? 'Closed' : 'Open' } : u
    ));
  }, []);

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

  return (
    <WaterDataContext.Provider value={{ sensorData, billInfo, dailyUsage, monthlyUsage, systemStats, mockUsers, toggleValve, toggleUserValve }}>
      {children}
    </WaterDataContext.Provider>
  );
}

export function useWaterData() {
  const ctx = useContext(WaterDataContext);
  if (!ctx) throw new Error('useWaterData must be used within WaterDataProvider');
  return ctx;
}
