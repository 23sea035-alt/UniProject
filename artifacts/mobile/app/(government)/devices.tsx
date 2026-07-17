import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWaterData, MockUser } from '@/contexts/WaterDataContext';
import * as Haptics from 'expo-haptics';

function DeviceCard({ user }: { user: MockUser }) {
  const colors = useColors();
  const battColor = user.battery < 30 ? colors.destructive : user.battery < 50 ? colors.warning : colors.success;

  const handleEmergency = () => {
    Alert.alert('Emergency Shutdown', `Close valve for ${user.meterId}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Shutdown', style: 'destructive', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) },
    ]);
  };

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MaterialCommunityIcons name="gauge" size={24} color={user.online ? colors.primary : colors.mutedForeground} />
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>{user.meterId}</Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>{user.firstName} {user.lastName} — {user.district}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: user.online ? colors.success : colors.destructive }} />
          <Text style={{ fontSize: 11, color: user.online ? colors.success : colors.destructive, fontFamily: 'Inter_600SemiBold' }}>{user.online ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Flow', value: `${user.flowRate.toFixed(1)} L/m`, color: colors.primary },
          { label: 'P1', value: `${user.pressure1.toFixed(2)} bar`, color: colors.accent },
          { label: 'Batt', value: `${user.battery}%`, color: battColor },
          { label: 'Valve', value: user.valveStatus, color: user.valveStatus === 'Open' ? colors.success : colors.destructive },
        ].map(item => (
          <View key={item.label} style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 8, padding: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: item.color, fontFamily: 'Inter_700Bold' }}>{item.value}</Text>
            <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 }}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${user.battery}%`, backgroundColor: battColor, borderRadius: 3 }} />
        </View>
        {!user.online || user.battery < 30 ? (
          <TouchableOpacity onPress={handleEmergency} style={{ backgroundColor: `${colors.destructive}18`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.destructive, fontFamily: 'Inter_600SemiBold' }}>Alert</Text>
          </TouchableOpacity>
        ) : (
          <Feather name="check-circle" size={16} color={colors.success} />
        )}
      </View>
    </View>
  );
}

export default function DevicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mockUsers, systemStats } = useWaterData();
  const [showAll, setShowAll] = useState(false);

  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);
  const sorted = [...mockUsers].sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingBottom: 20, paddingHorizontal: 20 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    statItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, alignItems: 'center' },
    statVal: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter_500Medium', marginTop: 2 },
    listContent: { paddingHorizontal: 16, paddingBottom: bottomPad, paddingTop: 16 },
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <Text style={s.headerTitle}>Device Monitoring</Text>
        <Text style={s.headerSub}>ESP32 smart water meter status</Text>
        <View style={s.statsRow}>
          {[
            { label: 'Total', value: systemStats.totalUsers, color: '#fff' },
            { label: 'Online', value: systemStats.onlineDevices, color: '#4ade80' },
            { label: 'Offline', value: systemStats.offlineDevices, color: '#f87171' },
            { label: 'Low Batt', value: systemStats.lowBatteryDevices, color: '#fbbf24' },
          ].map(s => (
            <View key={s.label} style={s.statItem}>
              <Text style={[s.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={s.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <FlatList
        data={sorted}
        keyExtractor={u => u.uid}
        renderItem={({ item }) => <DeviceCard user={item} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
