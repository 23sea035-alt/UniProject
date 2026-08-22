import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWaterData } from '@/contexts/WaterDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { valveApi, meterApi } from '@/lib/api';
import * as Haptics from 'expo-haptics';

function SensorRow({ label, value, unit, icon, color }: { label: string; value: string; unit: string; icon: React.ReactNode; color: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.border }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        {icon}
      </View>
      <Text style={{ flex: 1, fontSize: 14, color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color, fontFamily: 'Inter_700Bold' }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.mutedForeground, marginLeft: 4, fontFamily: 'Inter_400Regular' }}>{unit}</Text>
    </View>
  );
}

interface MeterStatus {
  flowRate: number;
  pressure1: number;
  pressure2: number;
  valveStatus: string;
  wifiSignal: number;
  online: boolean;
}

export default function MonitoringScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sensorData, valveLocked, valveLockReason, requestValveAction, valveLoading } = useWaterData();
  const { user } = useAuth();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [meterStatus, setMeterStatus] = useState<MeterStatus | null>(null);
  const [lastSync, setLastSync] = useState(new Date());

  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const fetchMeterData = useCallback(async () => {
    if (!user?.meterId) return;
    try {
      const [meterRes, valveRes] = await Promise.allSettled([
        meterApi.getStatus(user.meterId),
        valveApi.getStatus(user.meterId),
      ]);

      let m: any = null;
      if (meterRes.status === 'fulfilled') {
        m = meterRes.value.data || meterRes.value;
      }

      let valveData: any = null;
      if (valveRes.status === 'fulfilled') {
        valveData = valveRes.value.data || valveRes.value;
      }

      const valveStatus = valveData?.status ?? m?.valveStatus ?? sensorData.valveStatus;
      const normalizedValve = typeof valveStatus === 'string'
        ? valveStatus.charAt(0).toUpperCase() + valveStatus.slice(1).toLowerCase()
        : 'Closed';

      setMeterStatus({
        flowRate: m?.flowRate ?? sensorData.flowRate,
        pressure1: m?.pressure1 ?? sensorData.pressure1,
        pressure2: m?.pressure2 ?? sensorData.pressure2,
        valveStatus: normalizedValve,
        wifiSignal: m?.wifiSignal ?? sensorData.wifiSignal,
        online: m?.online ?? sensorData.online,
      });
      setLastSync(new Date());
    } catch (e: any) {
      console.warn('Meter fetch failed:', e.message);
    }
  }, [user?.meterId]);

  useEffect(() => { fetchMeterData(); }, [fetchMeterData]);

  const handleToggleValve = () => {
    if (valveLocked) {
      Alert.alert('Valve Locked', valveLockReason);
      return;
    }
    const currentValve = meterStatus?.valveStatus ?? sensorData.valveStatus;
    const action: 'open' | 'close' = currentValve === 'Open' ? 'close' : 'open';
    const actionLabel = action === 'close' ? 'Close' : 'Open';

    Alert.alert(`${actionLabel} Valve`, `Are you sure you want to ${action} the solenoid valve?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: actionLabel,
        style: action === 'close' ? 'destructive' : 'default',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          const result = await requestValveAction(action);

          if (result.success) {
            Alert.alert('Request Sent', result.message || 'Valve command submitted. Awaiting device confirmation.');
            fetchMeterData();
          } else if (result.denialReason === 'PAYMENT_REQUIRED') {
            Alert.alert('Service Restricted', result.message);
          } else {
            Alert.alert('Valve Error', result.message || 'Failed to control valve. Please try again.');
          }
        },
      },
    ]);
  };

  const flowRate = meterStatus?.flowRate ?? sensorData.flowRate;
  const pressure1 = meterStatus?.pressure1 ?? sensorData.pressure1;
  const pressure2 = meterStatus?.pressure2 ?? sensorData.pressure2;
  const valveStatus = meterStatus?.valveStatus ?? sensorData.valveStatus;
  const wifiSignal = meterStatus?.wifiSignal ?? sensorData.wifiSignal;
  const isOnline = meterStatus?.online ?? sensorData.online;

  const valveOpen = valveStatus === 'Open' || valveStatus === 'open';

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingBottom: 28, paddingHorizontal: 20 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
    liveTxt: { fontSize: 12, color: '#fff', fontWeight: '700', fontFamily: 'Inter_700Bold', letterSpacing: 1 },
    flowCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 20, marginTop: 16, alignItems: 'center' },
    flowLabel: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 1 },
    flowValue: { fontSize: 56, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold', lineHeight: 64 },
    flowUnit: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter_400Regular' },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 12 },
    cardTitle: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
    valveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    valveStatus: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    valveLabel: { fontSize: 16, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold' },
    valveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, overflow: 'hidden' },
    valveBtnInner: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    valveBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 8 },
    syncTxt: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>Live Monitoring</Text>
          <View style={s.liveBadge}>
            <Animated.View style={[s.liveDot, { opacity: pulseAnim }]} />
            <Text style={s.liveTxt}>LIVE</Text>
          </View>
        </View>
        <View style={s.flowCard}>
          <Text style={s.flowLabel}>Current Flow Rate</Text>
          <Text style={s.flowValue}>{flowRate.toFixed(1)}</Text>
          <Text style={s.flowUnit}>Litres / min</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Pressure Sensors</Text>
          <SensorRow label="Sensor 1" value={pressure1.toFixed(2)} unit="bar" icon={<Feather name="activity" size={18} color={colors.accent} />} color={colors.accent} />
          <SensorRow label="Sensor 2" value={pressure2.toFixed(2)} unit="bar" icon={<Feather name="activity" size={18} color={colors.info} />} color={colors.info} />
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Solenoid Valve</Text>
          {valveLocked && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginBottom: 12 }}>
              <Feather name="lock" size={16} color="#dc2626" />
              <Text style={{ fontSize: 12, color: '#7f1d1d', fontFamily: 'Inter_500Medium', flex: 1 }}>{valveLockReason}</Text>
            </View>
          )}
          <View style={s.valveRow}>
            <View style={s.valveStatus}>
              <MaterialCommunityIcons name="pipe-valve" size={28} color={valveOpen ? colors.success : colors.destructive} />
              <View>
                <Text style={s.valveLabel}>{valveLocked ? 'Locked' : valveStatus}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>
                  {valveLocked ? 'Control disabled by authority' : valveOpen ? 'Water is flowing' : 'Water supply stopped'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleToggleValve} activeOpacity={0.85} disabled={valveLocked || valveLoading} style={{ opacity: valveLocked || valveLoading ? 0.5 : 1 }}>
              <LinearGradient
                colors={valveLocked ? ['#6b7280', '#4b5563'] : valveOpen ? ['#dc2626', '#b91c1c'] : ['#16a34a', '#15803d']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.valveBtnInner}
              >
                <Text style={s.valveBtnTxt}>{valveLoading ? 'Sending...' : valveLocked ? 'Locked' : valveOpen ? 'Close Valve' : 'Open Valve'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Device Info</Text>
          <SensorRow label="WiFi Signal" value={wifiSignal.toString()} unit="dBm" icon={<Feather name="wifi" size={18} color={colors.primary} />} color={colors.primary} />
          <SensorRow label="Device Status" value={isOnline ? 'Online' : 'Offline'} unit="" icon={<Feather name="server" size={18} color={isOnline ? colors.success : colors.destructive} />} color={isOnline ? colors.success : colors.destructive} />
        </View>

        <View style={s.syncRow}>
          <Feather name="refresh-cw" size={11} color={colors.mutedForeground} />
          <Text style={s.syncTxt}>Updated: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
