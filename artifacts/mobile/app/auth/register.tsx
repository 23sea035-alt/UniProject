import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

interface Field { key: string; label: string; placeholder: string; keyboard?: any; secure?: boolean; cap?: any }

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('user');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', nic: '', phone: '', email: '', password: '', confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);

  const setField = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.firstName || !form.lastName) return 'Enter your full name.';
    if (!form.nic || form.nic.length < 10) return 'Enter a valid NIC number.';
    if (!form.phone || form.phone.length < 10) return 'Enter a valid phone number.';
    if (!form.email.includes('@')) return 'Enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!agreed) return 'Please accept the Terms & Conditions.';
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) { Alert.alert('Invalid Input', err); return; }
    setLoading(true);
    try {
      await register({ ...form, role });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(user)/dashboard');
    } catch (e: any) {
      Alert.alert('Registration Failed', e?.message || 'Unknown error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 16,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground, fontFamily: 'Inter_700Bold', marginLeft: 14 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    roleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    roleBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 2, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    roleTxt: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
    row: { flexDirection: 'row', gap: 10 },
    lbl: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Inter_600SemiBold', marginTop: 14 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 12, borderWidth: 1,
      borderColor: colors.border, paddingHorizontal: 12, height: 50,
    },
    input: { flex: 1, fontSize: 15, color: colors.foreground, fontFamily: 'Inter_400Regular' },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
    checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    checkTxt: { flex: 1, fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 18 },
    link: { color: colors.primary },
    regBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 24 },
    regInner: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    regTxt: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    loginTxt: { fontSize: 14, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    loginLink: { fontSize: 14, color: colors.primary, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
    divider: { height: 1, backgroundColor: colors.border, marginTop: 20, marginBottom: 20 },
    sectionHdr: { fontSize: 14, fontWeight: '600', color: colors.foreground, fontFamily: 'Inter_600SemiBold', marginBottom: 4, marginTop: 6 },
  });

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create Account</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[s.sectionHdr, { marginTop: 0 }]}>Account Type</Text>
        <View style={s.roleRow}>
          <TouchableOpacity key="user"
            style={[s.roleBtn, { borderColor: colors.primary, backgroundColor: colors.secondary }]}>
            <Feather name="user" size={14} color={colors.primary} />
            <Text style={[s.roleTxt, { color: colors.primary }]}>Resident</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionHdr}>Personal Information</Text>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.lbl}>First Name</Text>
            <View style={s.inputRow}>
              <TextInput style={s.input} value={form.firstName} onChangeText={setField('firstName')} placeholder="Kasun" placeholderTextColor={colors.mutedForeground} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.lbl}>Last Name</Text>
            <View style={s.inputRow}>
              <TextInput style={s.input} value={form.lastName} onChangeText={setField('lastName')} placeholder="Perera" placeholderTextColor={colors.mutedForeground} />
            </View>
          </View>
        </View>

        <Text style={s.lbl}>NIC Number</Text>
        <View style={s.inputRow}>
          <Feather name="credit-card" size={16} color={colors.mutedForeground} style={{ marginRight: 10 }} />
          <TextInput style={s.input} value={form.nic} onChangeText={setField('nic')} placeholder="199512345678" placeholderTextColor={colors.mutedForeground} />
        </View>

        <Text style={s.lbl}>Mobile Number</Text>
        <View style={s.inputRow}>
          <Feather name="phone" size={16} color={colors.mutedForeground} style={{ marginRight: 10 }} />
          <TextInput style={s.input} value={form.phone} onChangeText={setField('phone')} placeholder="0771234567" placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" />
        </View>

        <View style={s.divider} />
        <Text style={s.sectionHdr}>Login Details</Text>

        <Text style={s.lbl}>Email Address</Text>
        <View style={s.inputRow}>
          <Feather name="mail" size={16} color={colors.mutedForeground} style={{ marginRight: 10 }} />
          <TextInput style={s.input} value={form.email} onChangeText={setField('email')} placeholder="your@email.lk" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <Text style={s.lbl}>Password</Text>
        <View style={s.inputRow}>
          <Feather name="lock" size={16} color={colors.mutedForeground} style={{ marginRight: 10 }} />
          <TextInput style={s.input} value={form.password} onChangeText={setField('password')} placeholder="Min. 6 characters" placeholderTextColor={colors.mutedForeground} secureTextEntry={!showPass} />
          <TouchableOpacity onPress={() => setShowPass(v => !v)}>
            <Feather name={showPass ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <Text style={s.lbl}>Confirm Password</Text>
        <View style={s.inputRow}>
          <Feather name="lock" size={16} color={colors.mutedForeground} style={{ marginRight: 10 }} />
          <TextInput style={s.input} value={form.confirmPassword} onChangeText={setField('confirmPassword')} placeholder="Re-enter password" placeholderTextColor={colors.mutedForeground} secureTextEntry />
        </View>

        <TouchableOpacity style={s.checkRow} onPress={() => setAgreed(v => !v)} activeOpacity={0.7}>
          <View style={[s.checkBox, { borderColor: agreed ? colors.primary : colors.border, backgroundColor: agreed ? colors.primary : 'transparent' }]}>
            {agreed && <Feather name="check" size={13} color="#fff" />}
          </View>
          <Text style={s.checkTxt}>
            I agree to the <Text style={s.link}>Terms & Conditions</Text> and <Text style={s.link}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.regBtn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
          <LinearGradient colors={['#1565C0', '#0D47A1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.regInner}>
            {loading && <ActivityIndicator color="#fff" size="small" />}
            <Text style={s.regTxt}>{loading ? 'Creating Account…' : 'Create Account'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={s.loginRow}>
          <Text style={s.loginTxt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
