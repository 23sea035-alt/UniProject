import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWaterData } from '@/contexts/WaterDataContext';
import { SimpleBarChart } from '@/components/SimpleBarChart';
import { SimpleLineChart } from '@/components/SimpleLineChart';

type Period = 'daily' | 'monthly';

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { dailyUsage, monthlyUsage } = useWaterData();
  const [period, setPeriod] = useState<Period>('monthly');

  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);

  const activeMonthly = monthlyUsage.filter(m => m.usage > 0);
  const monthlyData = activeMonthly.map(m => ({ label: m.month, value: m.usage }));
  const dailyData = dailyUsage.slice(-20).map(d => ({ label: d.day.toString(), value: d.usage }));

  const data = period === 'monthly' ? monthlyData : dailyData;
  const lineData = period === 'monthly' ? monthlyData : dailyData;
  const values = data.map(d => d.value);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const max = values.length ? Math.max(...values) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const totalUsage = values.reduce((a, b) => a + b, 0);

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingBottom: 28, paddingHorizontal: 20 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', marginTop: 4 },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad },
    segRow: { flexDirection: 'row', backgroundColor: colors.muted, borderRadius: 12, padding: 4, marginBottom: 16 },
    seg: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    segTxt: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
    card: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 12 },
    cardTitle: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
    statRow: { flexDirection: 'row', gap: 10 },
    statCard: { flex: 1, backgroundColor: colors.muted, borderRadius: 12, padding: 12, alignItems: 'center' },
    statVal: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
    statLbl: { fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
    totalCard: { backgroundColor: colors.secondary, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    totalLbl: { fontSize: 13, color: colors.primary, fontFamily: 'Inter_600SemiBold' },
    totalVal: { fontSize: 24, fontWeight: '700', color: colors.primary, fontFamily: 'Inter_700Bold' },
    chartWrap: { alignItems: 'center', marginTop: 4 },
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <Text style={s.headerTitle}>Usage Reports</Text>
        <Text style={s.headerSub}>Water consumption analytics</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Period selector */}
        <View style={s.segRow}>
          {(['daily', 'monthly'] as Period[]).map(p => (
            <TouchableOpacity key={p} style={[s.seg, period === p && { backgroundColor: colors.card }]} onPress={() => setPeriod(p)} activeOpacity={0.7}>
              <Text style={[s.segTxt, { color: period === p ? colors.primary : colors.mutedForeground }]}>
                {p === 'daily' ? 'Daily (Last 20)' : 'Monthly (YTD)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total banner */}
        <View style={s.totalCard}>
          <View>
            <Text style={s.totalLbl}>Total {period === 'monthly' ? 'YTD' : 'Period'} Usage</Text>
            <Text style={s.totalVal}>{totalUsage.toFixed(1)} m³</Text>
          </View>
          <Feather name="trending-up" size={32} color={colors.primary} />
        </View>

        {/* Bar Chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{period === 'monthly' ? 'Monthly Usage (m³)' : 'Daily Usage (m³)'}</Text>
          <View style={s.chartWrap}>
            <SimpleBarChart data={data} height={160} width={300} highlightLast />
          </View>
        </View>

        {/* Line trend */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Usage Trend</Text>
          <View style={s.chartWrap}>
            <SimpleLineChart data={lineData} height={130} width={300} filled showDots={data.length <= 12} />
          </View>
        </View>

        {/* Stats */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Statistics</Text>
          <View style={s.statRow}>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: colors.primary }]}>{avg.toFixed(1)}</Text>
              <Text style={s.statLbl}>Average</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: colors.destructive }]}>{max.toFixed(1)}</Text>
              <Text style={s.statLbl}>Highest</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: colors.success }]}>{min.toFixed(1)}</Text>
              <Text style={s.statLbl}>Lowest</Text>
            </View>
          </View>
        </View>

        {/* Conservation tip */}
        <View style={[s.card, { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }]}>
          <Feather name="info" size={18} color={colors.info} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.info, fontFamily: 'Inter_600SemiBold' }}>Water Conservation Tip</Text>
            <Text style={{ fontSize: 12, color: colors.navyLight, fontFamily: 'Inter_400Regular', marginTop: 4, lineHeight: 18 }}>
              Reducing usage by 10% can save over 1.5 m³ per month. Check for leaks if your daily usage exceeds 0.9 m³.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
