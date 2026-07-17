import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useWaterData } from '@/contexts/WaterDataContext';

interface StatCardProps { label: string; value: string | number; icon: React.ReactNode; color: string; }
function StatCard({ label, value, icon, color }: StatCardProps) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: colors.radius, padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{icon}</View>
      <Text style={{ fontSize: 22, fontWeight: '700', color, fontFamily: 'Inter_700Bold' }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

interface AlertRowProps { icon: string; label: string; count: number; color: string; }
function AlertRow({ icon, label, count, color }: AlertRowProps) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Feather name={icon as any} size={16} color={color} />
      </View>
      <Text style={{ flex: 1, fontSize: 14, color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{label}</Text>
      {count > 0 && (
        <View style={{ backgroundColor: color, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' }}>{count}</Text>
        </View>
      )}
      {count === 0 && <Feather name="check-circle" size={16} color={colors.success} />}
    </View>
  );
}

export default function GovDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { systemStats } = useWaterData();

  const now = new Date();
  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingBottom: 28, paddingHorizontal: 20 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
    badgeTxt: { fontSize: 11, color: '#fff', fontFamily: 'Inter_600SemiBold' },
    title: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular' },
    name: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold', marginTop: 2 },
    date: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter_400Regular', marginTop: 4 },
    revenueCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 18, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    revLbl: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.6 },
    revVal: { fontSize: 28, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold', marginTop: 4 },
    revSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_400Regular', marginTop: 2 },
    content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: bottomPad },
    sectionHdr: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
    row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 12 },
    cardTitle: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
    usageRow: { flexDirection: 'row', gap: 10 },
    usageItem: { flex: 1, backgroundColor: colors.muted, borderRadius: 12, padding: 12, alignItems: 'center' },
    usageVal: { fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold', color: colors.primary },
    usageLbl: { fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.title}>Authority Portal</Text>
            <Text style={s.name}>{user?.firstName} {user?.lastName}</Text>
            <Text style={s.date}>
              {now.toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={s.badge}>
            <Feather name="shield" size={12} color="#fff" />
            <Text style={s.badgeTxt}>NWSDB Admin</Text>
          </View>
        </View>
        <View style={s.revenueCard}>
          <View>
            <Text style={s.revLbl}>Monthly Revenue</Text>
            <Text style={s.revVal}>LKR {systemStats.totalRevenue.toLocaleString()}</Text>
            <Text style={s.revSub}>{systemStats.totalUsers} active accounts</Text>
          </View>
          <MaterialCommunityIcons name="bank" size={40} color="rgba(255,255,255,0.5)" />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Device Status */}
        <Text style={s.sectionHdr}>System Overview</Text>
        <View style={s.row}>
          <StatCard label="Total Users" value={systemStats.totalUsers} icon={<Feather name="users" size={18} color={colors.primary} />} color={colors.primary} />
          <StatCard label="Online" value={systemStats.onlineDevices} icon={<Feather name="wifi" size={18} color={colors.success} />} color={colors.success} />
          <StatCard label="Offline" value={systemStats.offlineDevices} icon={<Feather name="wifi-off" size={18} color={colors.destructive} />} color={colors.destructive} />
        </View>

        {/* Usage Stats */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Water Usage</Text>
          <View style={s.usageRow}>
            <View style={s.usageItem}>
              <Text style={s.usageVal}>{systemStats.dailyUsage.toFixed(1)}</Text>
              <Text style={s.usageLbl}>Today (m³)</Text>
            </View>
            <View style={s.usageItem}>
              <Text style={s.usageVal}>{systemStats.monthlyUsage.toFixed(0)}</Text>
              <Text style={s.usageLbl}>Monthly (m³)</Text>
            </View>
          </View>
        </View>

        {/* Alerts */}
        <Text style={[s.sectionHdr, { marginTop: 4 }]}>System Alerts</Text>
        <View style={s.card}>
          <AlertRow icon="alert-triangle" label="Leak Detection Alerts" count={systemStats.leakAlerts} color={colors.destructive} />
          <AlertRow icon="battery" label="Low Battery Devices" count={systemStats.lowBatteryDevices} color={colors.warning} />
          <AlertRow icon="file-text" label="Overdue Bill Accounts" count={systemStats.redBillAlerts} color={colors.destructive} />
          <View style={{ borderBottomWidth: 0 }}>
            <AlertRow icon="activity" label="Pressure Anomalies" count={systemStats.pressureAlerts} color={colors.warning} />
          </View>
        </View>

        {/* Quick Summary */}
        <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
          <MaterialCommunityIcons name="water-pump" size={36} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>System Health</Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 3 }}>
              {Math.round((systemStats.onlineDevices / systemStats.totalUsers) * 100)}% devices online — {systemStats.offlineDevices > 0 ? `${systemStats.offlineDevices} require attention` : 'All devices operational'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
