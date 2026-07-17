import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useWaterData } from '@/contexts/WaterDataContext';
import { MetricCard } from '@/components/MetricCard';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function UserDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sensorData, billInfo } = useWaterData();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const valveColor = sensorData.valveStatus === 'Open' ? colors.success : colors.destructive;
  const battColor = sensorData.battery < 30 ? colors.destructive : sensorData.battery < 50 ? colors.warning : colors.success;
  const statusDot = sensorData.online ? colors.success : colors.destructive;

  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const webTopPad = Platform.OS === 'web' ? 67 : 0;

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

  const statusBgColors: Record<string, string> = { green: '#22c55e20', orange: '#f59e0b20', red: '#ef444420' };
  const statusFgColors: Record<string, string> = { green: colors.success, orange: colors.warning, red: colors.destructive };
  const statusLabel = { green: 'Current', orange: 'Moderate', red: 'High Usage' };

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
              <Text style={s.statusTxt}>{sensorData.online ? 'Device Online' : 'Device Offline'}</Text>
            </View>
          </View>
          <View style={s.meterBadge}>
            <Text style={s.meterTxt}>{user?.meterId}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Usage Summary Card */}
        <LinearGradient colors={['#1565C0', '#0288D1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.usageCard, { borderRadius: colors.radius }]}>
          <View style={s.usageItem}>
            <Text style={s.usageVal}>{sensorData.todayUsage.toFixed(1)}</Text>
            <Text style={s.usageUnit}>m³</Text>
            <Text style={s.usageLbl}>Today</Text>
          </View>
          <View style={s.usageDivider} />
          <View style={s.usageItem}>
            <Text style={s.usageVal}>{sensorData.totalUnits.toFixed(1)}</Text>
            <Text style={s.usageUnit}>m³</Text>
            <Text style={s.usageLbl}>This Month</Text>
          </View>
          <View style={s.usageDivider} />
          <View style={s.usageItem}>
            <Text style={s.usageVal}>{Math.round(billInfo.total / 1000 * 10) / 10}k</Text>
            <Text style={s.usageUnit}>LKR</Text>
            <Text style={s.usageLbl}>Est. Bill</Text>
          </View>
        </LinearGradient>

        <Text style={s.sectionHdr}>Live Sensor Readings</Text>
        <View style={s.grid}>
          <View style={s.gridItem}>
            <MetricCard
              label="Flow Rate"
              value={sensorData.flowRate.toFixed(1)}
              unit="L/min"
              icon={<MaterialCommunityIcons name="water" size={20} color={colors.primary} />}
              statusColor={colors.primary}
              accentBg
            />
          </View>
          <View style={s.gridItem}>
            <MetricCard
              label="Pressure"
              value={sensorData.pressure1.toFixed(2)}
              unit="bar"
              icon={<Feather name="activity" size={20} color={colors.accent} />}
              statusColor={colors.accent}
              accentBg
            />
          </View>
          <View style={s.gridItem}>
            <MetricCard
              label="Battery"
              value={`${sensorData.battery}%`}
              icon={<MaterialCommunityIcons name="battery-80" size={20} color={battColor} />}
              statusColor={battColor}
              accentBg
            />
          </View>
          <View style={s.gridItem}>
            <MetricCard
              label="Valve"
              value={sensorData.valveStatus}
              icon={<MaterialCommunityIcons name="pipe-valve" size={20} color={valveColor} />}
              statusColor={valveColor}
              accentBg
            />
          </View>
        </View>

        {/* Bill Status */}
        <Text style={s.sectionHdr}>Current Bill</Text>
        <View style={s.billCard}>
          <View style={s.billLeft}>
            <Text style={s.billLbl}>Estimated Total</Text>
            <Text style={[s.billAmt, { color: statusFgColors[billInfo.status] }]}>LKR {billInfo.total.toFixed(2)}</Text>
            <Text style={s.billDue}>Due: {billInfo.dueDate}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusBgColors[billInfo.status] }]}>
            <Feather name={billInfo.status === 'green' ? 'check-circle' : billInfo.status === 'orange' ? 'alert-circle' : 'alert-triangle'} size={14} color={statusFgColors[billInfo.status]} />
            <Text style={[s.badgeTxt, { color: statusFgColors[billInfo.status] }]}>{statusLabel[billInfo.status]}</Text>
          </View>
        </View>

        <View style={s.syncRow}>
          <Feather name="refresh-cw" size={11} color={colors.mutedForeground} />
          <Text style={s.syncTxt}>Last sync: {sensorData.lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
