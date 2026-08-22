import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(user)/dashboard');
    } catch (e: any) {
      Alert.alert('Login Failed', e?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    root: { flex: 1 },
    gradient: { flex: 1 },
    header: {
      paddingTop: insets.top + 40,
      paddingBottom: 36,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    logoWrap: {
      width: 80, height: 80, borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    },
    appName: { fontSize: 30, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
    tagline: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 6, fontFamily: 'Inter_400Regular' },
    body: {
      flex: 1, backgroundColor: colors.background,
      borderTopLeftRadius: 32, borderTopRightRadius: 32,
      paddingHorizontal: 24, paddingTop: 30,
    },
    scrollContent: { paddingBottom: Math.max(insets.bottom + 20, 40) },
    lbl: {
      fontSize: 11, fontWeight: '600', color: colors.mutedForeground,
      marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8,
      fontFamily: 'Inter_600SemiBold',
    },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 14, marginBottom: 14, height: 52,
    },
    input: { flex: 1, fontSize: 15, color: colors.foreground, fontFamily: 'Inter_400Regular' },
    forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
    forgotTxt: { fontSize: 14, color: colors.primary, fontFamily: 'Inter_500Medium' },
    loginBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 22 },
    loginInner: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    loginTxt: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    registerTxt: { fontSize: 14, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    registerLink: { fontSize: 14, color: colors.primary, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground, fontFamily: 'Inter_700Bold', marginBottom: 18 },
  });

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.gradient}>
        <View style={s.header}>
          <View style={s.logoWrap}>
            <MaterialCommunityIcons name="water-pump" size={42} color="#fff" />
          </View>
          <Text style={s.appName}>AquaTrack</Text>
          <Text style={s.tagline}>Smart Water Monitoring — Sri Lanka</Text>
        </View>

        <View style={s.body}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.scrollContent}>
            <Text style={s.sectionTitle}>Sign In</Text>

            <Text style={s.lbl}>Email Address</Text>
            <View style={s.inputRow}>
              <Feather name="mail" size={17} color={colors.mutedForeground} style={{ marginRight: 10 }} />
              <TextInput
                style={s.input} value={email} onChangeText={setEmail}
                placeholder="your@email.lk" placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address" autoCapitalize="none"
              />
            </View>

            <Text style={s.lbl}>Password</Text>
            <View style={s.inputRow}>
              <Feather name="lock" size={17} color={colors.mutedForeground} style={{ marginRight: 10 }} />
              <TextInput
                style={s.input} value={password} onChangeText={setPassword}
                placeholder="••••••••" placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={17} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.forgotBtn} onPress={() => router.push('/auth/forgot-password')}>
              <Text style={s.forgotTxt}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={['#1565C0', '#0D47A1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.loginInner}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : null}
                <Text style={s.loginTxt}>{loading ? 'Signing In…' : 'Sign In'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.registerRow}>
              <Text style={s.registerTxt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={s.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
