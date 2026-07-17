import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWaterData } from '@/contexts/WaterDataContext';
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

export default function MonitoringScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sensorData, toggleValve } = useWaterData();
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  const handleToggleValve = () => {
    const action = sensorData.valveStatus === 'Open' ? 'Close' : 'Open';
    Alert.alert(`${action} Valve`, `Are you sure you want to ${action.toLowerCase()} the solenoid valve?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, style: action === 'Close' ? 'destructive' : 'default', onPress: () => { toggleValve(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
    ]);
  };

  const valveOpen = sensorData.valveStatus === 'Open';
  const battColor = sensorData.battery < 30 ? colors.destructive : sensorData.battery < 50 ? colors.warning : colors.success;

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
    battRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    battBar: { flex: 1, height: 10, backgroundColor: colors.muted, borderRadius: 5, overflow: 'hidden' },
    battFill: { height: '100%', borderRadius: 5 },
    battPct: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
    syncRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 8 },
    syncTxt: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    hydroStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    hydroDot: { width: 8, height: 8, borderRadius: 4 },
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
          <Text style={s.flowValue}>{sensorData.flowRate.toFixed(1)}</Text>
          <Text style={s.flowUnit}>Litres / min</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Pressure Readings */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Pressure Sensors</Text>
          <SensorRow label="Sensor 1" value={sensorData.pressure1.toFixed(2)} unit="bar" icon={<Feather name="activity" size={18} color={colors.accent} />} color={colors.accent} />
          <SensorRow label="Sensor 2" value={sensorData.pressure2.toFixed(2)} unit="bar" icon={<Feather name="activity" size={18} color={colors.info} />} color={colors.info} />
        </View>

        {/* Battery */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Battery & Power</Text>
          <View style={s.battRow}>
            <MaterialCommunityIcons name="battery-80" size={22} color={battColor} />
            <View style={s.battBar}>
              <View style={[s.battFill, { width: `${sensorData.battery}%`, backgroundColor: battColor }]} />
            </View>
            <Text style={[s.battPct, { color: battColor }]}>{sensorData.battery}%</Text>
          </View>
          <SensorRow
            label="Hydro Generator"
            value={sensorData.hydroVoltage.toFixed(1)}
            unit="V"
            icon={<MaterialCommunityIcons name="lightning-bolt" size={18} color={colors.warning} />}
            color={colors.warning}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${colors.success}18`, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <MaterialCommunityIcons name="power" size={18} color={colors.success} />
            </View>
            <Text style={{ flex: 1, fontSize: 14, color: colors.foreground, fontFamily: 'Inter_500Medium' }}>Generator Status</Text>
            <View style={s.hydroStatus}>
              <View style={[s.hydroDot, { backgroundColor: sensorData.hydroStatus === 'Active' ? colors.success : colors.destructive }]} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: sensorData.hydroStatus === 'Active' ? colors.success : colors.destructive, fontFamily: 'Inter_600SemiBold' }}>{sensorData.hydroStatus}</Text>
            </View>
          </View>
        </View>

        {/* Valve Control */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Solenoid Valve</Text>
          <View style={s.valveRow}>
            <View style={s.valveStatus}>
              <MaterialCommunityIcons name="pipe-valve" size={28} color={valveOpen ? colors.success : colors.destructive} />
              <View>
                <Text style={s.valveLabel}>{sensorData.valveStatus}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>
                  {valveOpen ? 'Water is flowing' : 'Water supply stopped'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleToggleValve} activeOpacity={0.85}>
              <LinearGradient
                colors={valveOpen ? ['#dc2626', '#b91c1c'] : ['#16a34a', '#15803d']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.valveBtnInner}
              >
                <Text style={s.valveBtnTxt}>{valveOpen ? 'Close Valve' : 'Open Valve'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Device Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Device Info</Text>
          <SensorRow label="WiFi Signal" value={sensorData.wifiSignal.toString()} unit="dBm" icon={<Feather name="wifi" size={18} color={colors.primary} />} color={colors.primary} />
          <SensorRow label="Device Status" value={sensorData.online ? 'Online' : 'Offline'} unit="" icon={<Feather name="server" size={18} color={sensorData.online ? colors.success : colors.destructive} />} color={sensorData.online ? colors.success : colors.destructive} />
        </View>

        <View style={s.syncRow}>
          <Feather name="refresh-cw" size={11} color={colors.mutedForeground} />
          <Text style={s.syncTxt}>Updated: {sensorData.lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
