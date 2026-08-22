import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useWaterData } from '@/contexts/WaterDataContext';
import { MetricCard } from '@/components/MetricCard';
import { billApi, meterApi, valveApi, deviceApi } from '@/lib/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

interface MeterData {
  flowRate: number;
  pressure1: number;
  valveStatus: string;
  online: boolean;
  todayUsage: number;
  totalUnits: number;
}

interface BillData {
  amount: number;
  status: string;
  dueDate: string;
}

interface ValveData {
  status: string;
  locked: boolean;
  lockReason?: string;
}

export default function UserDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sensorData, billInfo, valveLocked, valveLockReason } = useWaterData();

  const [meterData, setMeterData] = useState<MeterData | null>(null);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [valveData, setValveData] = useState<ValveData | null>(null);
  const [serviceStatus, setServiceStatus] = useState<string>('active');
  const [lastSync, setLastSync] = useState(new Date());
  const [ledOn, setLedOn] = useState(false);
  const [ledLoading, setLedLoading] = useState(false);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const webTopPad = Platform.OS === 'web' ? 67 : 0;

  const fetchDashboardData = useCallback(async () => {
    try {
      if (!user?.meterId) return;

      const [meterRes, billRes, valveRes, ledRes] = await Promise.allSettled([
        meterApi.getStatus(user.meterId),
        billApi.getCurrent(),
        valveApi.getStatus(user.meterId),
        deviceApi.getLedState(user.meterId),
      ]);

      if (meterRes.status === 'fulfilled') {
        const m = meterRes.value.data || meterRes.value;
        setMeterData({
          flowRate: m.flowRate ?? sensorData.flowRate,
          pressure1: m.pressure1 ?? sensorData.pressure1,
          valveStatus: m.valveStatus ?? sensorData.valveStatus,
          online: m.online ?? sensorData.online,
          todayUsage: m.todayUsage ?? sensorData.todayUsage,
          totalUnits: m.totalUnits ?? sensorData.totalUnits,
        });
      }

      if (billRes.status === 'fulfilled') {
        const b = billRes.value.bill || billRes.value;
        setBillData({
          amount: b.amount || 0,
          status: b.status || 'unpaid',
          dueDate: b.dueDate || 'N/A',
        });
        if (b.serviceStatus) {
          setServiceStatus(b.serviceStatus);
        }
      }

      if (valveRes.status === 'fulfilled') {
        const v = valveRes.value.data || valveRes.value;
        const rawStatus = v.status ?? 'closed';
        const normalizedStatus = typeof rawStatus === 'string'
          ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase()
          : 'Closed';
        setValveData({
          status: normalizedStatus,
          locked: v.locked ?? false,
          lockReason: v.lockReason,
        });
      }

      if (ledRes.status === 'fulfilled') {
        const l = ledRes.value.data || ledRes.value;
        if (typeof l.on === 'boolean') setLedOn(l.on);
      }

      setLastSync(new Date());
    } catch (e) {
      console.warn('Dashboard fetch failed:', e);
    }
  }, [user?.meterId]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const toggleLed = useCallback(async (on: boolean) => {
    if (!user?.meterId) return;
    const prev = ledOn;
    setLedOn(on);
    setLedLoading(true);
    try {
      await deviceApi.setLed(user.meterId, on);
      Alert.alert('LED Command Sent', `ESP32 will turn the LED ${on ? 'ON' : 'OFF'} within a few seconds.`);
      // Re-sync the switch with the real state once the device has ACKed
      setTimeout(() => { fetchDashboardData(); }, 4000);
    } catch (e: any) {
      setLedOn(prev);
      Alert.alert('Failed', e?.message || 'Could not send LED command');
    } finally {
      setLedLoading(false);
    }
  }, [user?.meterId, ledOn, fetchDashboardData]);

  const flowRate = meterData?.flowRate ?? sensorData.flowRate;
  const pressure = meterData?.pressure1 ?? sensorData.pressure1;
  const valveStatus = valveData?.status ?? meterData?.valveStatus ?? sensorData.valveStatus;
  const isOnline = meterData?.online ?? sensorData.online;
  const todayUsage = meterData?.todayUsage ?? sensorData.todayUsage;
  const totalUnits = meterData?.totalUnits ?? sensorData.totalUnits;
  const currentBillAmount = billData?.amount ?? billInfo.total;
  const dueDate = billData?.dueDate ?? billInfo.dueDate;
  const isValveLocked = valveData?.locked ?? valveLocked;
  const lockReason = valveData?.lockReason ?? valveLockReason;

  const valveColor = valveStatus === 'Open' ? colors.success : colors.destructive;
  const statusDot = isOnline ? colors.success : colors.destructive;

  const billStatus = billData?.status === 'paid' ? 'green' : billData?.status === 'overdue' ? 'red' : billInfo.status;
  const statusBgColors: Record<string, string> = { green: '#22c55e20', orange: '#f59e0b20', red: '#ef444420' };
  const statusFgColors: Record<string, string> = { green: colors.success, orange: colors.warning, red: colors.destructive };
  const statusLabel: Record<string, string> = { green: 'Current', orange: 'Moderate', red: 'High Usage' };

  const serviceStatusLabel: Record<string, string> = {
    active: 'Active',
    grace_period: 'Grace Period',
    restricted: 'Restricted',
    disconnected: 'Disconnected',
  };
  const serviceStatusColor: Record<string, string> = {
    active: colors.success,
    grace_period: colors.warning,
    restricted: colors.destructive,
    disconnected: '#6b7280',
  };

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: Math.max(insets.top, webTopPad) + 16, paddingBottom: 28, paddingHorizontal: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular' },
    userName: { fontSize: 24, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold', marginTop: 2 },
    dateText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter_400Regular', marginTop: 4 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusTxt: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter_500Medium' },
    meterBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    meterTxt: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_500Medium' },
    content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: bottomPad },
    usageCard: { borderRadius: colors.radius, padding: 18, marginBottom: 16, flexDirection: 'row', gap: 0 },
    usageDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 0 },
    usageItem: { flex: 1, alignItems: 'center' },
    usageVal: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    usageUnit: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter_400Regular', marginTop: 1 },
    usageLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_500Medium', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionHdr: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    gridItem: { width: '47.5%' },
    billCard: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, marginBottom: 16 },
    billLeft: { gap: 4 },
    billLbl: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.6 },
    billAmt: { fontSize: 28, fontWeight: '700', fontFamily: 'Inter_700Bold' },
    billDue: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
    badgeTxt: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
    syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 8 },
    syncTxt: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.greeting}>{greeting}</Text>
            <Text style={s.userName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={s.dateText}>{dateStr}</Text>
            <View style={s.statusRow}>
              <View style={[s.statusDot, { backgroundColor: statusDot }]} />
              <Text style={s.statusTxt}>{isOnline ? 'Device Online' : 'Device Offline'}</Text>
            </View>
          </View>
          <View style={s.meterBadge}>
            <Text style={s.meterTxt}>{user?.meterId}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#1565C0', '#0288D1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.usageCard, { borderRadius: colors.radius }]}>
          <View style={s.usageItem}>
            <Text style={s.usageVal}>{todayUsage.toFixed(1)}</Text>
            <Text style={s.usageUnit}>m³</Text>
            <Text style={s.usageLbl}>Today</Text>
          </View>
          <View style={s.usageDivider} />
          <View style={s.usageItem}>
            <Text style={s.usageVal}>{totalUnits.toFixed(1)}</Text>
            <Text style={s.usageUnit}>m³</Text>
            <Text style={s.usageLbl}>This Month</Text>
          </View>
          <View style={s.usageDivider} />
          <View style={s.usageItem}>
            <Text style={s.usageVal}>{Math.round(currentBillAmount / 1000 * 10) / 10}k</Text>
            <Text style={s.usageUnit}>LKR</Text>
            <Text style={s.usageLbl}>Est. Bill</Text>
          </View>
        </LinearGradient>

        {isValveLocked && (
          <View style={[s.billCard, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Feather name="lock" size={14} color="#dc2626" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626', fontFamily: 'Inter_700Bold' }}>Valve Locked</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#7f1d1d', fontFamily: 'Inter_400Regular', lineHeight: 18 }}>{lockReason}</Text>
            </View>
          </View>
        )}

        {serviceStatus !== 'active' && (
          <View style={[s.billCard, { backgroundColor: `${serviceStatusColor[serviceStatus]}15`, borderColor: `${serviceStatusColor[serviceStatus]}40` }]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name={serviceStatus === 'restricted' ? 'alert-triangle' : serviceStatus === 'disconnected' ? 'x-circle' : 'alert-circle'} size={14} color={serviceStatusColor[serviceStatus]} />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: serviceStatusColor[serviceStatus], fontFamily: 'Inter_700Bold' }}>Service: {serviceStatusLabel[serviceStatus] || serviceStatus}</Text>
                {serviceStatus === 'restricted' && (
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Outstanding balance must be paid to restore service</Text>
                )}
                {serviceStatus === 'grace_period' && (
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Please clear your dues before the grace period ends</Text>
                )}
              </View>
            </View>
          </View>
        )}

        <Text style={s.sectionHdr}>Live Sensor Readings</Text>
        <View style={s.grid}>
          <View style={s.gridItem}>
            <MetricCard
              label="Flow Rate"
              value={flowRate.toFixed(1)}
              unit="L/min"
              icon={<MaterialCommunityIcons name="water" size={20} color={colors.primary} />}
              statusColor={colors.primary}
              accentBg
            />
          </View>
          <View style={s.gridItem}>
            <MetricCard
              label="Pressure"
              value={pressure.toFixed(2)}
              unit="bar"
              icon={<Feather name="activity" size={20} color={colors.accent} />}
              statusColor={colors.accent}
              accentBg
            />
          </View>
          <View style={s.gridItem}>
            <MetricCard
              label="Valve"
              value={valveStatus}
              icon={<MaterialCommunityIcons name="pipe-valve" size={20} color={valveColor} />}
              statusColor={valveColor}
              accentBg
            />
          </View>
        </View>

        <Text style={s.sectionHdr}>ESP32 LED Test</Text>
        <View style={s.billCard}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Feather name="zap" size={18} color={ledOn ? '#f59e0b' : colors.mutedForeground} />
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground, fontFamily: 'Inter_700Bold' }}>Device LED</Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>
                {ledLoading ? 'Sending command...' : ledOn ? 'Command sent: LED ON' : 'Toggle to test ESP32 link'}
              </Text>
            </View>
          </View>
          <Switch
            value={ledOn}
            onValueChange={toggleLed}
            disabled={ledLoading}
            trackColor={{ false: colors.border, true: '#f59e0b60' }}
            thumbColor={ledOn ? '#f59e0b' : colors.mutedForeground}
          />
        </View>

        <Text style={s.sectionHdr}>Current Bill</Text>
        <View style={s.billCard}>
          <View style={s.billLeft}>
            <Text style={s.billLbl}>Estimated Total</Text>
            <Text style={[s.billAmt, { color: statusFgColors[billStatus] }]}>LKR {currentBillAmount.toFixed(2)}</Text>
            <Text style={s.billDue}>Due: {dueDate}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusBgColors[billStatus] }]}>
            <Feather name={billStatus === 'green' ? 'check-circle' : billStatus === 'orange' ? 'alert-circle' : 'alert-triangle'} size={14} color={statusFgColors[billStatus]} />
            <Text style={[s.badgeTxt, { color: statusFgColors[billStatus] }]}>{statusLabel[billStatus]}</Text>
          </View>
        </View>

        <View style={s.syncRow}>
          <Feather name="refresh-cw" size={11} color={colors.mutedForeground} />
          <Text style={s.syncTxt}>Last sync: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
