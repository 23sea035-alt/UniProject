import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [notifs, setNotifs] = useState({ highUsage: true, lowPressure: true, leakDetection: true, billDue: true, valveAlert: true });

  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); await logout(); } },
    ]);
  };

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingBottom: 28, paddingHorizontal: 20, alignItems: 'center' },
    avatarRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 12 },
    avatarTxt: { fontSize: 26, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    name: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    role: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', marginTop: 4 },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 12 },
    cardTitle: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
    infoIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    infoLbl: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    infoVal: { fontSize: 14, color: colors.foreground, fontFamily: 'Inter_500Medium', marginTop: 1 },
    notifRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
    notifLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    notifTxt: { fontSize: 14, color: colors.foreground, fontFamily: 'Inter_500Medium' },
    actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.border },
    actionTxt: { flex: 1, fontSize: 14, color: colors.foreground, fontFamily: 'Inter_500Medium', marginLeft: 14 },
    logoutBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
    logoutInner: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    logoutTxt: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    versionTxt: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 12 },
  });

  const infoItems = [
    { icon: 'credit-card', label: 'NIC Number', value: user?.nic ?? '—' },
    { icon: 'phone', label: 'Mobile', value: user?.phone ?? '—' },
    { icon: 'mail', label: 'Email', value: user?.email ?? '—' },
    { icon: 'map-pin', label: 'Address', value: user?.address || 'Not set' },
  ];

  const notifItems: { key: keyof typeof notifs; label: string; icon: string; color: string }[] = [
    { key: 'highUsage', label: 'High Water Usage', icon: 'droplet', color: colors.destructive },
    { key: 'lowPressure', label: 'Low Pressure Alert', icon: 'activity', color: colors.warning },
    { key: 'leakDetection', label: 'Leak Detection', icon: 'alert-triangle', color: colors.destructive },
    { key: 'billDue', label: 'Bill Due Reminder', icon: 'file-text', color: colors.primary },
    { key: 'valveAlert', label: 'Valve Status Change', icon: 'settings', color: colors.info },
  ];

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.avatarRing}>
          <Text style={s.avatarTxt}>{initials}</Text>
        </View>
        <Text style={s.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={s.role}>Water Meter Account — {user?.meterId}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Personal Information</Text>
          {infoItems.map((item, i) => (
            <View key={item.label} style={[s.infoRow, i === infoItems.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={s.infoIcon}>
                <Feather name={item.icon as any} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLbl}>{item.label}</Text>
                <Text style={s.infoVal}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Meter Info */}
        <View style={[s.card, { backgroundColor: colors.secondary, borderColor: `${colors.primary}30` }]}>
          <Text style={[s.cardTitle, { color: colors.primary }]}>Device Details</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <MaterialCommunityIcons name="gauge" size={40} color={colors.primary} />
            <View>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Water Meter ID</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary, fontFamily: 'Inter_700Bold' }}>{user?.meterId}</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 }}>National Water Supply & Drainage Board</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Push Notifications</Text>
          {notifItems.map((item, i) => (
            <View key={item.key} style={[s.notifRow, i === notifItems.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={s.notifLeft}>
                <Feather name={item.icon as any} size={16} color={item.color} />
                <Text style={s.notifTxt}>{item.label}</Text>
              </View>
              <Switch
                value={notifs[item.key]}
                onValueChange={v => setNotifs(n => ({ ...n, [item.key]: v }))}
                trackColor={{ false: colors.border, true: `${colors.primary}60` }}
                thumbColor={notifs[item.key] ? colors.primary : colors.mutedForeground}
              />
            </View>
          ))}
        </View>

        {/* Help */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Support</Text>
          {[
            { icon: 'help-circle', label: 'Help & Support', color: colors.primary },
            { icon: 'shield', label: 'Privacy Policy', color: colors.mutedForeground },
            { icon: 'file-text', label: 'Terms & Conditions', color: colors.mutedForeground },
          ].map((item, i) => (
            <View key={item.label} style={[s.actionRow, i === 2 && { borderBottomWidth: 0 }]}>
              <Feather name={item.icon as any} size={18} color={item.color} />
              <Text style={s.actionTxt}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LinearGradient colors={['#dc2626', '#b91c1c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.logoutInner}>
            <Feather name="log-out" size={18} color="#fff" />
            <Text style={s.logoutTxt}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={s.versionTxt}>AquaTrack v1.0.0 — NWSDB Sri Lanka</Text>
      </ScrollView>
    </View>
  );
}
