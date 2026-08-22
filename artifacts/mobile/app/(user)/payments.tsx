import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';

interface Payment {
  _id: string;
  paymentId: string;
  billId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method: string;
  createdAt: string;
  paidAt?: string;
  billingPeriod?: string;
}

const statusConfig: Record<string, { bg: string; fg: string; label: string; icon: string }> = {
  pending: { bg: '#22c55e20', fg: '#16a34a', label: 'Pending', icon: 'clock' },
  completed: { bg: '#1565C020', fg: '#1565C0', label: 'Completed', icon: 'check-circle' },
  failed: { bg: '#dc262620', fg: '#dc2626', label: 'Failed', icon: 'x-circle' },
};

export default function PaymentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await api.getPaymentHistory();
      setPayments(res.payments || res || []);
    } catch (e: any) {
      console.warn('Failed to fetch payments:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
  };

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingBottom: 28, paddingHorizontal: 20 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', marginTop: 4 },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 12 },
    paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.border },
    paymentLast: { borderBottomWidth: 0 },
    iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    paymentInfo: { flex: 1 },
    paymentAmount: { fontSize: 16, fontWeight: '700', color: colors.foreground, fontFamily: 'Inter_700Bold' },
    paymentDate: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
    paymentPeriod: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 1 },
    paymentMethod: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', textTransform: 'capitalize' },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    badgeTxt: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
    emptySub: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 14, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 12 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: colors.muted, borderRadius: 12, padding: 12, alignItems: 'center' },
    summaryVal: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
    summaryLbl: { fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
    sectionHdr: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  });

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  if (loading) {
    return (
      <View style={s.root}>
        <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
          <Text style={s.headerTitle}>Payment History</Text>
          <Text style={s.headerSub}>Track your payments</Text>
        </LinearGradient>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Loading payments...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <Text style={s.headerTitle}>Payment History</Text>
        <Text style={s.headerSub}>Track your payments</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {payments.length === 0 ? (
          <View style={s.emptyContainer}>
            <View style={s.emptyIcon}>
              <MaterialCommunityIcons name="credit-card-off-outline" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={s.emptyTitle}>No Payments Yet</Text>
            <Text style={s.emptySub}>Your payment history will appear here once you make your first payment.</Text>
          </View>
        ) : (
          <>
            {/* Summary */}
            <View style={s.summaryRow}>
              <View style={s.summaryCard}>
                <Text style={[s.summaryVal, { color: colors.success }]}>LKR {totalPaid.toFixed(2)}</Text>
                <Text style={s.summaryLbl}>Total Paid</Text>
              </View>
              <View style={s.summaryCard}>
                <Text style={[s.summaryVal, { color: colors.warning }]}>{pendingCount}</Text>
                <Text style={s.summaryLbl}>Pending</Text>
              </View>
              <View style={s.summaryCard}>
                <Text style={[s.summaryVal, { color: colors.primary }]}>{payments.length}</Text>
                <Text style={s.summaryLbl}>Total</Text>
              </View>
            </View>

            {/* Payment list */}
            <Text style={s.sectionHdr}>All Payments</Text>
            <View style={s.card}>
              {payments.map((payment, i) => {
                const sc2 = statusConfig[payment.status] || statusConfig.pending;
                return (
                  <View key={payment._id || payment.paymentId || i} style={[s.paymentRow, i === payments.length - 1 && s.paymentLast]}>
                    <View style={[s.iconWrap, { backgroundColor: sc2.bg }]}>
                      <Feather name={sc2.icon as any} size={18} color={sc2.fg} />
                    </View>
                    <View style={s.paymentInfo}>
                      <Text style={s.paymentAmount}>LKR {(payment.amount || 0).toFixed(2)}</Text>
                      <Text style={s.paymentDate}>{formatDate(payment.createdAt || payment.paidAt)} {formatTime(payment.createdAt || payment.paidAt)}</Text>
                      {payment.billingPeriod && <Text style={s.paymentPeriod}>Period: {payment.billingPeriod}</Text>}
                      <Text style={s.paymentMethod}>Method: {payment.method || 'N/A'}</Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: sc2.bg }]}>
                      <Feather name={sc2.icon as any} size={12} color={sc2.fg} />
                      <Text style={[s.badgeTxt, { color: sc2.fg }]}>{sc2.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
