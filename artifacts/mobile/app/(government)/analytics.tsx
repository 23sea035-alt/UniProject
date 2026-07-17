import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWaterData } from '@/contexts/WaterDataContext';
import { SimpleBarChart } from '@/components/SimpleBarChart';
import { SimpleLineChart } from '@/components/SimpleLineChart';

type Period = 'monthly' | 'district';

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mockUsers, monthlyUsage, systemStats } = useWaterData();
  const [period, setPeriod] = useState<Period>('monthly');

  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);

  const activeMonthly = monthlyUsage.filter(m => m.usage > 0);
  const monthlyData = activeMonthly.map(m => ({ label: m.month, value: m.usage * mockUsers.length / 1 }));

  const districts = Array.from(new Set(mockUsers.map(u => u.district)));
  const districtData = districts.map(d => ({
    label: d.slice(0, 3),
    value: mockUsers.filter(u => u.district === d).reduce((s, u) => s + u.currentUnits, 0),
  }));

  const revenueData = activeMonthly.map((m, i) => ({
    label: m.month,
    value: mockUsers.reduce((s, u) => s + u.currentBill, 0) * (0.8 + i * 0.02),
  }));

  const chartData = period === 'monthly' ? monthlyData : districtData;

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingBottom: 24, paddingHorizontal: 20 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', marginTop: 4 },
    summaryRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    summaryItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, alignItems: 'center' },
    summaryVal: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    summaryLbl: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter_500Medium', marginTop: 2, textAlign: 'center' },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad },
    segRow: { flexDirection: 'row', backgroundColor: colors.muted, borderRadius: 12, padding: 4, marginBottom: 14 },
    seg: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
    segTxt: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 12 },
    cardTitle: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
    chartWrap: { alignItems: 'center' },
    statRow: { flexDirection: 'row', gap: 10 },
    statCard: { flex: 1, backgroundColor: colors.muted, borderRadius: 12, padding: 12, alignItems: 'center' },
    statVal: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
    statLbl: { fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
    distRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <Text style={s.headerTitle}>System Analytics</Text>
        <Text style={s.headerSub}>District-wide water usage & revenue</Text>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryVal}>{systemStats.monthlyUsage.toFixed(0)} m³</Text>
            <Text style={s.summaryLbl}>Monthly Usage</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryVal}>LKR {(systemStats.totalRevenue / 1000).toFixed(0)}k</Text>
            <Text style={s.summaryLbl}>Revenue</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryVal}>{districts.length}</Text>
            <Text style={s.summaryLbl}>Districts</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.segRow}>
          {(['monthly', 'district'] as Period[]).map(p => (
            <TouchableOpacity key={p} style={[s.seg, period === p && { backgroundColor: colors.card }]} onPress={() => setPeriod(p)} activeOpacity={0.7}>
              <Text style={[s.segTxt, { color: period === p ? colors.primary : colors.mutedForeground }]}>
                {p === 'monthly' ? 'Monthly Trend' : 'By District'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{period === 'monthly' ? 'Monthly Water Usage (m³)' : 'Usage by District (m³)'}</Text>
          <View style={s.chartWrap}>
            <SimpleBarChart data={chartData} height={160} width={300} highlightLast={period === 'monthly'} />
          </View>
        </View>

        {period === 'monthly' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Revenue Trend (LKR)</Text>
            <View style={s.chartWrap}>
              <SimpleLineChart data={revenueData} height={130} width={300} lineColor={colors.success} filled showDots={false} />
            </View>
          </View>
        )}

        {period === 'district' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>District Breakdown</Text>
            {districts.map((d, i) => {
              const users = mockUsers.filter(u => u.district === d);
              const total = users.reduce((s, u) => s + u.currentUnits, 0);
              const revenue = users.reduce((s, u) => s + u.currentBill, 0);
              return (
                <View key={d} style={[s.distRow, i === districts.length - 1 && { borderBottomWidth: 0 }]}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>{d}</Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>{users.length} meter{users.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary, fontFamily: 'Inter_700Bold' }}>{total.toFixed(1)} m³</Text>
                    <Text style={{ fontSize: 12, color: colors.success, fontFamily: 'Inter_600SemiBold' }}>LKR {revenue}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={s.card}>
          <Text style={s.cardTitle}>Summary Statistics</Text>
          <View style={s.statRow}>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: colors.primary }]}>{(systemStats.monthlyUsage / systemStats.totalUsers).toFixed(1)}</Text>
              <Text style={s.statLbl}>Avg m³/User</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: colors.success }]}>LKR {Math.round(systemStats.totalRevenue / systemStats.totalUsers)}</Text>
              <Text style={s.statLbl}>Avg Bill</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
