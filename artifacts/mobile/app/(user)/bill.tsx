import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWaterData } from '@/contexts/WaterDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface BillData {
  _id: string;
  billId: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'overdue';
  dueDate: string;
  billingPeriod: string;
  consumption: number;
  tierBreakdown: { tier: string; units: number; rate: number; amount: number }[];
  variableCharge: number;
  fixedCharge: number;
  systemLevy: number;
  stampDuty: number;
}

export default function BillScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { billInfo } = useWaterData();
  const { user } = useAuth();

  const [bill, setBill] = useState<BillData | null>(null);
  const [previousBills, setPreviousBills] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(false);

  const now = new Date();
  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [currentRes, historyRes] = await Promise.all([
        api.getCurrentBill(),
        api.getBillHistory(),
      ]);
      setBill(currentRes.bill || currentRes);
      setPreviousBills(historyRes.bills || historyRes || []);
    } catch (e: any) {
      console.warn('API unavailable, using mock data:', e.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handlePayNow = async () => {
    if (!bill) return;
    try {
      setPaying(true);
      await api.createPayment(bill.billId || bill._id);
      Alert.alert('Payment Initiated', 'Your payment is being processed. You will receive a confirmation shortly.');
      fetchBills();
    } catch (e: any) {
      Alert.alert('Payment Failed', e.message || 'Unable to process payment. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const displayBill = bill && !error
    ? {
        total: bill.amount,
        dueDate: bill.dueDate || 'N/A',
        units: bill.consumption,
        status: bill.status === 'paid' ? 'green' as const : bill.status === 'overdue' ? 'red' as const : 'orange' as const,
        tierBreakdown: bill.tierBreakdown || [],
        variableCharge: bill.variableCharge || 0,
        fixedCharge: bill.fixedCharge || 0,
        systemLevy: bill.systemLevy || 0,
        stampDuty: bill.stampDuty || 0,
        paymentStatus: bill.status,
      }
    : {
        total: billInfo.total,
        dueDate: billInfo.dueDate,
        units: billInfo.units,
        status: billInfo.status as 'green' | 'orange' | 'red',
        tierBreakdown: billInfo.tierBreakdown,
        variableCharge: billInfo.variableCharge,
        fixedCharge: billInfo.fixedCharge,
        systemLevy: billInfo.systemLevy,
        stampDuty: billInfo.stampDuty,
        paymentStatus: 'unpaid' as const,
      };

  const statusColors: Record<string, { bg: string; fg: string; label: string; icon: string }> = {
    green: { bg: '#16a34a', fg: '#fff', label: 'Normal Usage', icon: 'check-circle' },
    orange: { bg: '#d97706', fg: '#fff', label: 'Moderate Usage', icon: 'alert-circle' },
    red: { bg: '#dc2626', fg: '#fff', label: 'High Usage — Action Required', icon: 'alert-triangle' },
  };
  const sc = statusColors[displayBill.status];

  const paymentStatusConfig: Record<string, { bg: string; fg: string; label: string }> = {
    paid: { bg: '#16a34a20', fg: '#16a34a', label: 'Paid' },
    unpaid: { bg: '#d9770620', fg: '#d97706', label: 'Unpaid' },
    overdue: { bg: '#dc262620', fg: '#dc2626', label: 'Overdue' },
  };
  const psc = paymentStatusConfig[displayBill.paymentStatus] || paymentStatusConfig.unpaid;

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
    payBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 12 },
    payBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    payBtnDisabled: { opacity: 0.6 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeTxt: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
    historyLast: { borderBottomWidth: 0 },
    historyPeriod: { fontSize: 14, fontWeight: '500', color: colors.foreground, fontFamily: 'Inter_500Medium' },
    historyAmt: { fontSize: 14, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold' },
    historyDate: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 14, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 12 },
  });

  if (loading) {
    return (
      <View style={s.root}>
        <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
          <Text style={s.headerTitle}>Water Bill</Text>
          <Text style={s.headerSub}>{MONTHS[now.getMonth()]} {now.getFullYear()}</Text>
        </LinearGradient>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Loading bill data...</Text>
        </View>
      </View>
    );
  }

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
            <Text style={s.statusTotal}>LKR {displayBill.total.toFixed(2)}</Text>
            <Text style={s.statusDue}>Due: {displayBill.dueDate}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: psc.bg }]}>
            <Text style={[s.badgeTxt, { color: psc.fg }]}>{psc.label}</Text>
          </View>
        </View>

        {/* Pay Now Button (only if unpaid/overdue) */}
        {displayBill.paymentStatus !== 'paid' && (
          <TouchableOpacity onPress={handlePayNow} disabled={paying} activeOpacity={0.85}>
            <LinearGradient
              colors={paying ? ['#6b7280', '#6b7280'] : ['#1565C0', '#0D47A1']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.payBtn, paying && s.payBtnDisabled]}
            >
              {paying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.payBtnTxt}>Pay Now — LKR {displayBill.total.toFixed(2)}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Account Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account Details</Text>
          <View style={s.infoRow}><Text style={s.infoLbl}>Account Holder</Text><Text style={s.infoVal}>{user?.firstName} {user?.lastName}</Text></View>
          <View style={s.infoRow}><Text style={s.infoLbl}>Meter ID</Text><Text style={s.infoVal}>{user?.meterId}</Text></View>
          <View style={s.infoRow}><Text style={s.infoLbl}>Billing Period</Text><Text style={s.infoVal}>{MONTHS[now.getMonth()]} {now.getFullYear()}</Text></View>
          <View style={[s.infoRow, { borderBottomWidth: 0 }]}><Text style={s.infoLbl}>Total Consumption</Text><Text style={[s.infoVal, { color: colors.primary }]}>{displayBill.units.toFixed(2)} m³</Text></View>
        </View>

        {/* Tier Breakdown */}
        {displayBill.tierBreakdown.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Usage Charges (NWSDB Tariff)</Text>
            <View style={s.tableHeader}>
              <Text style={[s.thTxt, { flex: 2 }]}>Tier</Text>
              <Text style={[s.thTxt, { flex: 1, textAlign: 'center' }]}>Units</Text>
              <Text style={[s.thTxt, { flex: 1, textAlign: 'center' }]}>Rate</Text>
              <Text style={[s.thTxt, { flex: 1, textAlign: 'right' }]}>Amount</Text>
            </View>
            {displayBill.tierBreakdown.map((row, i) => (
              <View key={i} style={[s.tierRow, i === displayBill.tierBreakdown.length - 1 && s.tierLast]}>
                <Text style={s.tierLabel}>{row.tier}</Text>
                <Text style={s.tierNum}>{row.units.toFixed(2)}</Text>
                <Text style={s.tierNum}>Rs.{row.rate}</Text>
                <Text style={s.tierAmt}>Rs.{row.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Charges Summary */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Bill Summary</Text>
          <View style={s.chargeRow}><Text style={s.chargeLbl}>Variable Charges</Text><Text style={s.chargeAmt}>LKR {displayBill.variableCharge.toFixed(2)}</Text></View>
          <View style={s.chargeRow}><Text style={s.chargeLbl}>Fixed Charge</Text><Text style={s.chargeAmt}>LKR {displayBill.fixedCharge.toFixed(2)}</Text></View>
          <View style={s.chargeRow}><Text style={s.chargeLbl}>System Levy</Text><Text style={s.chargeAmt}>LKR {displayBill.systemLevy.toFixed(2)}</Text></View>
          <View style={s.chargeRow}><Text style={s.chargeLbl}>Stamp Duty</Text><Text style={s.chargeAmt}>LKR {displayBill.stampDuty.toFixed(2)}</Text></View>
          <View style={s.totalRow}>
            <Text style={s.totalLbl}>Total Amount Due</Text>
            <Text style={s.totalAmt}>LKR {displayBill.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Previous Bills */}
        {previousBills.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Previous Bills</Text>
            {previousBills.slice(0, 6).map((pb, i) => (
              <View key={pb._id || pb.billId || i} style={[s.historyRow, i === Math.min(previousBills.length, 6) - 1 && s.historyLast]}>
                <View>
                  <Text style={s.historyPeriod}>{pb.billingPeriod || 'N/A'}</Text>
                  <Text style={s.historyDate}>LKR {(pb.amount || 0).toFixed(2)}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: paymentStatusConfig[pb.status]?.bg || '#f3f4f620' }]}>
                  <Text style={[s.badgeTxt, { color: paymentStatusConfig[pb.status]?.fg || colors.mutedForeground }]}>{pb.status || 'N/A'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

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
