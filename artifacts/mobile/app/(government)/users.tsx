import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useWaterData, MockUser } from '@/contexts/WaterDataContext';
import * as Haptics from 'expo-haptics';

type Filter = 'all' | 'online' | 'offline' | 'alert';

function UserCard({ user }: { user: MockUser }) {
  const colors = useColors();
  const router = useRouter();

  const billColor = user.billStatus === 'green' ? colors.success : user.billStatus === 'orange' ? colors.warning : colors.destructive;
  const battColor = user.battery < 30 ? colors.destructive : user.battery < 50 ? colors.warning : colors.success;

  return (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); router.push(`/(government)/user-detail?uid=${user.uid}`); }}
      activeOpacity={0.75}
      style={{ backgroundColor: colors.card, borderRadius: colors.radius, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary, fontFamily: 'Inter_700Bold' }}>
              {user.firstName[0]}{user.lastName[0]}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>{user.firstName} {user.lastName}</Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>{user.meterId}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: user.online ? colors.success : colors.mutedForeground }} />
          <Text style={{ fontSize: 11, color: user.online ? colors.success : colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>
            {user.online ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary, fontFamily: 'Inter_700Bold' }}>{user.currentUnits.toFixed(1)}</Text>
          <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>m³ used</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: billColor, fontFamily: 'Inter_700Bold' }}>LKR {user.currentBill}</Text>
          <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>bill</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: battColor, fontFamily: 'Inter_700Bold' }}>{user.battery}%</Text>
          <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>battery</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <MaterialCommunityIcons name="pipe-valve" size={20} color={user.valveStatus === 'Open' ? colors.success : colors.destructive} />
          <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>{user.valveStatus}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }}>{user.district}</Text>
          <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>district</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function UsersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mockUsers } = useWaterData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const bottomPad = insets.bottom + 72 + (Platform.OS === 'web' ? 34 : 0);
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);

  const filtered = useMemo(() => {
    let result = mockUsers;
    if (filter === 'online') result = result.filter(u => u.online);
    else if (filter === 'offline') result = result.filter(u => !u.online);
    else if (filter === 'alert') result = result.filter(u => u.billStatus === 'red' || u.battery < 30);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.meterId.toLowerCase().includes(q) ||
        u.nic.includes(q) ||
        u.district.toLowerCase().includes(q)
      );
    }
    return result;
  }, [mockUsers, search, filter]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: mockUsers.length },
    { key: 'online', label: 'Online', count: mockUsers.filter(u => u.online).length },
    { key: 'offline', label: 'Offline', count: mockUsers.filter(u => !u.online).length },
    { key: 'alert', label: 'Alerts', count: mockUsers.filter(u => u.billStatus === 'red' || u.battery < 30).length },
  ];

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingBottom: 20, paddingHorizontal: 20 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', marginTop: 4 },
    searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 12, height: 44, marginTop: 14 },
    searchInput: { flex: 1, fontSize: 15, color: '#fff', fontFamily: 'Inter_400Regular', marginLeft: 8 },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
    filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 5 },
    filterTxt: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
    filterCount: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    filterCountTxt: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
    listContent: { paddingHorizontal: 16, paddingBottom: bottomPad, paddingTop: 4 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyTxt: { fontSize: 15, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 12 },
    resultTxt: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', paddingHorizontal: 16, paddingBottom: 8 },
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <Text style={s.headerTitle}>User Management</Text>
        <Text style={s.headerSub}>Monitor and manage water meter accounts</Text>
        <View style={s.searchWrap}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, meter ID, NIC, district..."
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={s.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, {
              borderColor: filter === f.key ? colors.primary : colors.border,
              backgroundColor: filter === f.key ? colors.secondary : 'transparent',
            }]}
            onPress={() => { setFilter(f.key); Haptics.selectionAsync(); }}
          >
            <Text style={[s.filterTxt, { color: filter === f.key ? colors.primary : colors.mutedForeground }]}>{f.label}</Text>
            <View style={[s.filterCount, { backgroundColor: filter === f.key ? colors.primary : colors.muted }]}>
              <Text style={[s.filterCountTxt, { color: filter === f.key ? '#fff' : colors.mutedForeground }]}>{f.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.resultTxt}>{filtered.length} account{filtered.length !== 1 ? 's' : ''} found</Text>

      <FlatList
        data={filtered}
        keyExtractor={u => u.uid}
        renderItem={({ item }) => <UserCard user={item} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Feather name="users" size={44} color={colors.mutedForeground} />
            <Text style={s.emptyTxt}>No accounts found</Text>
          </View>
        }
      />
    </View>
  );
}
