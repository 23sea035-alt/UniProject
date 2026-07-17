import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWaterData } from '@/contexts/WaterDataContext';
import { useAuth } from '@/contexts/AuthContext';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function BillScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { billInfo, sensorData } = useWaterData();
  const { user } = useAuth();

  const now = new Date();
  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);

  const statusColors: Record<string, { bg: string; fg: string; label: string; icon: string }> = {
    green: { bg: '#16a34a', fg: '#fff', label: 'Normal Usage', icon: 'check-circle' },
    orange: { bg: '#d97706', fg: '#fff', label: 'Moderate Usage', icon: 'alert-circle' },
    red: { bg: '#dc2626', fg: '#fff', label: 'High Usage — Action Required', icon: 'alert-triangle' },
  };
  const sc = statusColors[billInfo.status];

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingBottom: 28, paddingHorizontal: 20 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', marginTop: 4 },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad },
    statusCard: { borderRadius: colors.radius, padding: 18, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
    statusIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    statusLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_500Medium' },
    statusTotal: { fontSize: 30, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    statusDue: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter_400Regular', marginTop: 2 },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 12 },
    cardTitle: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
    tierRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
    tierLast: { borderBottomWidth: 0 },
    tierLabel: { fontSize: 13, color: colors.foreground, fontFamily: 'Inter_500Medium', flex: 2 },
    tierNum: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', flex: 1, textAlign: 'center' },
    tierAmt: { fontSize: 13, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'right' },
    chargeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
    chargeLbl: { fontSize: 14, color: colors.foreground, fontFamily: 'Inter_400Regular' },
    chargeAmt: { fontSize: 14, color: colors.foreground, fontFamily: 'Inter_500Medium' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 2, borderColor: colors.primary, marginTop: 4 },
    totalLbl: { fontSize: 16, fontWeight: '700', color: colors.foreground, fontFamily: 'Inter_700Bold' },
    totalAmt: { fontSize: 20, fontWeight: '700', color: colors.primary, fontFamily: 'Inter_700Bold' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
    infoLbl: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    infoVal: { fontSize: 13, color: colors.foreground, fontFamily: 'Inter_600SemiBold' },
    tableHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 2, borderColor: colors.border, marginBottom: 2 },
    thTxt: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <Text style={s.headerTitle}>Water Bill</Text>
        <Text style={s.headerSub}>{MONTHS[now.getMonth()]} {now.getFullYear()} — Account: {user?.meterId}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <View style={[s.statusCard, { backgroundColor: sc.bg }]}>
          <View style={s.statusIcon}>
            <Feather name={sc.icon as any} size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.statusLabel}>{sc.label}</Text>
            <Text style={s.statusTotal}>LKR {billInfo.total.toFixed(2)}</Text>
            <Text style={s.statusDue}>Due: {billInfo.dueDate}</Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account Details</Text>
          <View style={s.infoRow}><Text style={s.infoLbl}>Account Holder</Text><Text style={s.infoVal}>{user?.firstName} {user?.lastName}</Text></View>
          <View style={s.infoRow}><Text style={s.infoLbl}>Meter ID</Text><Text style={s.infoVal}>{user?.meterId}</Text></View>
          <View style={s.infoRow}><Text style={s.infoLbl}>Billing Period</Text><Text style={s.infoVal}>{MONTHS[now.getMonth()]} {now.getFullYear()}</Text></View>
          <View style={[s.infoRow, { borderBottomWidth: 0 }]}><Text style={s.infoLbl}>Total Consumption</Text><Text style={[s.infoVal, { color: colors.primary }]}>{billInfo.units.toFixed(2)} m³</Text></View>
        </View>

        {/* Tier Breakdown */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Usage Charges (NWSDB Tariff)</Text>
          <View style={s.tableHeader}>
            <Text style={[s.thTxt, { flex: 2 }]}>Tier</Text>
            <Text style={[s.thTxt, { flex: 1, textAlign: 'center' }]}>Units</Text>
            <Text style={[s.thTxt, { flex: 1, textAlign: 'center' }]}>Rate</Text>
            <Text style={[s.thTxt, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>
          {billInfo.tierBreakdown.map((row, i) => (
            <View key={i} style={[s.tierRow, i === billInfo.tierBreakdown.length - 1 && s.tierLast]}>
              <Text style={s.tierLabel}>{row.tier}</Text>
              <Text style={s.tierNum}>{row.units.toFixed(2)}</Text>
              <Text style={s.tierNum}>Rs.{row.rate}</Text>
              <Text style={s.tierAmt}>Rs.{row.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Charges Summary */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Bill Summary</Text>
          <View style={s.chargeRow}><Text style={s.chargeLbl}>Variable Charges</Text><Text style={s.chargeAmt}>LKR {billInfo.variableCharge.toFixed(2)}</Text></View>
          <View style={s.chargeRow}><Text style={s.chargeLbl}>Fixed Charge</Text><Text style={s.chargeAmt}>LKR {billInfo.fixedCharge.toFixed(2)}</Text></View>
          <View style={s.chargeRow}><Text style={s.chargeLbl}>System Levy</Text><Text style={s.chargeAmt}>LKR {billInfo.systemLevy.toFixed(2)}</Text></View>
          <View style={s.chargeRow}><Text style={s.chargeLbl}>Stamp Duty</Text><Text style={s.chargeAmt}>LKR {billInfo.stampDuty.toFixed(2)}</Text></View>
          <View style={s.totalRow}>
            <Text style={s.totalLbl}>Total Amount Due</Text>
            <Text style={s.totalAmt}>LKR {billInfo.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment note */}
        <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <MaterialCommunityIcons name="bank" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Pay at any NWSDB Office</Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 }}>Bank transfers, mobile banking & counter payments accepted</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
