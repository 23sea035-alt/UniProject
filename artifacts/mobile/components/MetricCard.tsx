import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  statusColor?: string;
  accentBg?: boolean;
}

export function MetricCard({ label, value, unit, icon, statusColor, accentBg }: MetricCardProps) {
  const colors = useColors();
  const iconBg = accentBg
    ? (statusColor ? `${statusColor}22` : `${colors.primary}18`)
    : colors.muted;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg, borderRadius: colors.radius - 4 }]}>
        {icon}
      </View>
      <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: statusColor || colors.foreground }]}>{value}</Text>
        {unit ? <Text style={[styles.unit, { color: colors.mutedForeground }]}> {unit}</Text> : null}
      </View>
    </View>
  );
}

export function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[statStyles.chip, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
      <Text style={[statStyles.val, { color }]}>{value}</Text>
      <Text style={[statStyles.lbl, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 110,
  },
  iconWrap: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '500', fontFamily: 'Inter_500Medium', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  value: { fontSize: 22, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  unit: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});

const statStyles = StyleSheet.create({
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', minWidth: 70 },
  val: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  lbl: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2 },
});
