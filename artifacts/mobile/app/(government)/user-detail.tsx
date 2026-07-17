import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useWaterData } from '@/contexts/WaterDataContext';
import * as Haptics from 'expo-haptics';

export default function UserDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { mockUsers, toggleUserValve } = useWaterData();

  const user = mockUsers.find(u => u.uid === uid);
  const bottomPad = insets.bottom + 20 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>User not found</Text>
      </View>
    );
  }

  const valveOpen = user.valveStatus === 'Open';
  const billColor = user.billStatus === 'green' ? colors.success : user.billStatus === 'orange' ? colors.warning : colors.destructive;
  const battColor = user.battery < 30 ? colors.destructive : user.battery < 50 ? colors.warning : colors.success;

  const handleValveToggle = () => {
    const action = valveOpen ? 'Close' : 'Open';
    Alert.alert(`${action} Valve`, `${action} solenoid valve for ${user.firstName} ${user.lastName}?\n\nMeter: ${user.meterId}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, style: action === 'Close' ? 'destructive' : 'default', onPress: () => { toggleUserValve(user.uid); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
    ]);
  };

  const handleMarkPaid = () => Alert.alert('Mark as Paid', `Mark bill as paid for ${user.firstName} ${user.lastName}?`, [
    { text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) }
  ]);

  const handleSendReminder = () => Alert.alert('Send Reminder', `Send payment reminder to ${user.firstName}?`, [
    { text: 'Cancel', style: 'cancel' }, { text: 'Send', onPress: () => {} }
  ]);

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 10, paddingBottom: 24, paddingHorizontal: 20 },
    backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    backTxt: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter_500Medium', marginLeft: 10 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    avatarTxt: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    userName: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    meterId: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', marginTop: 4 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusTxt: { fontSize: 12, fontFamily: 'Inter_500Medium' },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 12 },
    cardTitle: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderColor: colors.border },
    infoLbl: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    infoVal: { fontSize: 13, color: colors.foreground, fontFamily: 'Inter_600SemiBold' },
    sensorRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    sensorItem: { flex: 1, backgroundColor: colors.muted, borderRadius: 12, padding: 12, alignItems: 'center' },
    sensorVal: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
    sensorLbl: { fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 3, textTransform: 'uppercase' },
    valveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
    valveName: { fontSize: 16, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold' },
    valveSub: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
    valveBtn: { borderRadius: 12, overflow: 'hidden' },
    valveBtnInner: { paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center' },
    valveBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    actionRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    actionBtnInner: { paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    actionBtnTxt: { fontSize: 13, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
    battRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
    battBar: { flex: 1, height: 8, backgroundColor: colors.muted, borderRadius: 4, overflow: 'hidden' },
    battFill: { height: '100%', borderRadius: 4 },
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <TouchableOpacity style={s.backRow} onPress={() => router.back()}>
          <View style={s.backBtn}><Feather name="arrow-left" size={16} color="#fff" /></View>
          <Text style={s.backTxt}>User Management</Text>
        </TouchableOpacity>
        <View style={s.avatar}><Text style={s.avatarTxt}>{user.firstName[0]}{user.lastName[0]}</Text></View>
        <Text style={s.userName}>{user.firstName} {user.lastName}</Text>
        <Text style={s.meterId}>{user.meterId} — {user.district}</Text>
        <View style={s.statusRow}>
          <View style={[s.statusDot, { backgroundColor: user.online ? colors.success : colors.destructive }]} />
          <Text style={[s.statusTxt, { color: user.online ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)' }]}>
            {user.online ? 'Device Online' : 'Device Offline'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account Details</Text>
          <View style={s.infoRow}><Text style={s.infoLbl}>NIC Number</Text><Text style={s.infoVal}>{user.nic}</Text></View>
          <View style={s.infoRow}><Text style={s.infoLbl}>Phone</Text><Text style={s.infoVal}>{user.phone}</Text></View>
          <View style={s.infoRow}><Text style={s.infoLbl}>Address</Text><Text style={s.infoVal}>{user.address}</Text></View>
          <View style={[s.infoRow, { borderBottomWidth: 0 }]}><Text style={s.infoLbl}>District</Text><Text style={s.infoVal}>{user.district}</Text></View>
        </View>

        {/* Sensor Readings */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Current Readings</Text>
          <View style={s.sensorRow}>
            <View style={s.sensorItem}>
              <Text style={[s.sensorVal, { color: colors.primary }]}>{user.flowRate.toFixed(1)}</Text>
              <Text style={s.sensorLbl}>Flow (L/min)</Text>
            </View>
            <View style={s.sensorItem}>
              <Text style={[s.sensorVal, { color: colors.accent }]}>{user.pressure1.toFixed(2)}</Text>
              <Text style={s.sensorLbl}>P1 (bar)</Text>
            </View>
            <View style={s.sensorItem}>
              <Text style={[s.sensorVal, { color: colors.info }]}>{user.pressure2.toFixed(2)}</Text>
              <Text style={s.sensorLbl}>P2 (bar)</Text>
            </View>
          </View>
          <View style={s.sensorRow}>
            <View style={s.sensorItem}>
              <Text style={[s.sensorVal, { color: colors.primary }]}>{user.currentUnits.toFixed(1)}</Text>
              <Text style={s.sensorLbl}>Units (m³)</Text>
            </View>
            <View style={s.sensorItem}>
              <Text style={[s.sensorVal, { color: battColor }]}>{user.battery}%</Text>
              <Text style={s.sensorLbl}>Battery</Text>
            </View>
          </View>
          <View style={s.battRow}>
            <MaterialCommunityIcons name="battery-80" size={18} color={battColor} />
            <View style={s.battBar}><View style={[s.battFill, { width: `${user.battery}%`, backgroundColor: battColor }]} /></View>
          </View>
        </View>

        {/* Valve Control */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Remote Valve Control</Text>
          <View style={s.valveRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <MaterialCommunityIcons name="pipe-valve" size={32} color={valveOpen ? colors.success : colors.destructive} />
              <View>
                <Text style={s.valveName}>{user.valveStatus}</Text>
                <Text style={s.valveSub}>{valveOpen ? 'Water flowing normally' : 'Supply interrupted'}</Text>
              </View>
            </View>
            <TouchableOpacity style={s.valveBtn} onPress={handleValveToggle} activeOpacity={0.85}>
              <LinearGradient colors={valveOpen ? ['#dc2626', '#b91c1c'] : ['#16a34a', '#15803d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.valveBtnInner}>
                <Text style={s.valveBtnTxt}>{valveOpen ? 'Close Valve' : 'Open Valve'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bill Management */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Bill Status</Text>
          <View style={s.infoRow}>
            <Text style={s.infoLbl}>Current Bill</Text>
            <Text style={[s.infoVal, { color: billColor }]}>LKR {user.currentBill.toLocaleString()}</Text>
          </View>
          <View style={[s.infoRow, { borderBottomWidth: 0, marginBottom: 14 }]}>
            <Text style={s.infoLbl}>Status</Text>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: `${billColor}18` }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: billColor, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' }}>{user.billStatus}</Text>
            </View>
          </View>
          <View style={s.actionRow}>
            <TouchableOpacity style={s.actionBtn} onPress={handleMarkPaid} activeOpacity={0.85}>
              <LinearGradient colors={[colors.success, '#15803d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.actionBtnInner}>
                <Feather name="check-circle" size={14} color="#fff" />
                <Text style={s.actionBtnTxt}>Mark Paid</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={handleSendReminder} activeOpacity={0.85}>
              <LinearGradient colors={[colors.primary, '#0D47A1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.actionBtnInner}>
                <Feather name="send" size={14} color="#fff" />
                <Text style={s.actionBtnTxt}>Send Reminder</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
