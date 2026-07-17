import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useWaterData } from '@/contexts/WaterDataContext';
import * as Haptics from 'expo-haptics';

export default function GovProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { systemStats } = useWaterData();

  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'End your administrator session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); await logout(); } },
    ]);
  };

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingBottom: 28, paddingHorizontal: 20, alignItems: 'center' },
    avatarRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    avatarTxt: { fontSize: 26, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    name: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    role: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter_400Regular', marginTop: 4 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 10 },
    badgeTxt: { fontSize: 12, color: '#fff', fontWeight: '700', fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    statItem: { flex: 1, backgroundColor: colors.secondary, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: `${colors.primary}20` },
    statVal: { fontSize: 20, fontWeight: '700', color: colors.primary, fontFamily: 'Inter_700Bold' },
    statLbl: { fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 12 },
    cardTitle: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
    infoIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    infoLbl: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    infoVal: { fontSize: 14, color: colors.foreground, fontFamily: 'Inter_500Medium', marginTop: 1 },
    actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.border },
    actionTxt: { flex: 1, fontSize: 14, color: colors.foreground, fontFamily: 'Inter_500Medium', marginLeft: 14 },
    logoutBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
    logoutInner: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    logoutTxt: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    versionTxt: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 12 },
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.avatarRing}><Text style={s.avatarTxt}>{initials}</Text></View>
        <Text style={s.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={s.role}>Government Administrator</Text>
        <View style={s.badge}>
          <Feather name="shield" size={12} color="#fff" />
          <Text style={s.badgeTxt}>NWSDB AUTHORITY</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{systemStats.totalUsers}</Text>
            <Text style={s.statLbl}>Accounts</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statVal}>{systemStats.onlineDevices}</Text>
            <Text style={s.statLbl}>Online</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: colors.success }]}>LKR {(systemStats.totalRevenue / 1000).toFixed(1)}k</Text>
            <Text style={s.statLbl}>Revenue</Text>
          </View>
        </View>

        {/* Admin Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Administrator Details</Text>
          {[
            { icon: 'credit-card', label: 'NIC Number', value: user?.nic ?? '—' },
            { icon: 'phone', label: 'Office Phone', value: user?.phone ?? '—' },
            { icon: 'mail', label: 'Email', value: user?.email ?? '—' },
            { icon: 'map-pin', label: 'Office Address', value: user?.address ?? '—' },
          ].map((item, i) => (
            <View key={item.label} style={[s.infoRow, i === 3 && { borderBottomWidth: 0 }]}>
              <View style={s.infoIcon}><Feather name={item.icon as any} size={17} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLbl}>{item.label}</Text>
                <Text style={s.infoVal}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Agency Info */}
        <View style={[s.card, { backgroundColor: colors.secondary, borderColor: `${colors.primary}30` }]}>
          <Text style={[s.cardTitle, { color: colors.primary }]}>Agency Information</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <MaterialCommunityIcons name="water-pump" size={40} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary, fontFamily: 'Inter_700Bold' }}>NWSDB</Text>
              <Text style={{ fontSize: 12, color: colors.foreground, fontFamily: 'Inter_500Medium', marginTop: 2 }}>National Water Supply & Drainage Board</Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 }}>Sri Lanka — Ministry of Water Supply</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={s.card}>
          <Text style={s.cardTitle}>System Settings</Text>
          {[
            { icon: 'bell', label: 'Alert Thresholds', color: colors.primary },
            { icon: 'bar-chart-2', label: 'Report Configuration', color: colors.primary },
            { icon: 'lock', label: 'Security & Audit Log', color: colors.primary },
            { icon: 'help-circle', label: 'Help & Documentation', color: colors.mutedForeground },
          ].map((item, i) => (
            <View key={item.label} style={[s.actionRow, i === 3 && { borderBottomWidth: 0 }]}>
              <Feather name={item.icon as any} size={18} color={item.color} />
              <Text style={s.actionTxt}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LinearGradient colors={['#dc2626', '#b91c1c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.logoutInner}>
            <Feather name="log-out" size={18} color="#fff" />
            <Text style={s.logoutTxt}>End Session</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={s.versionTxt}>AquaTrack Authority v1.0.0 — NWSDB Sri Lanka</Text>
      </ScrollView>
    </View>
  );
}
