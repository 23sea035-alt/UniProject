import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.includes('@')) { Alert.alert('Invalid Email', 'Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not send reset link. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    root: { flex: 1 },
    gradient: { flex: 1 },
    inner: { flex: 1, paddingTop: insets.top + 20, paddingHorizontal: 24 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
    iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold', marginBottom: 10 },
    subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', lineHeight: 22 },
    card: { backgroundColor: colors.card, borderRadius: 20, padding: 24, marginTop: 40 },
    lbl: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'Inter_600SemiBold' },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 52, marginBottom: 20 },
    input: { flex: 1, fontSize: 15, color: colors.foreground, fontFamily: 'Inter_400Regular' },
    btn: { borderRadius: 14, overflow: 'hidden' },
    btnInner: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    btnTxt: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
    backLink: { marginTop: 20, alignItems: 'center' },
    backLinkTxt: { fontSize: 14, color: colors.primary, fontFamily: 'Inter_600SemiBold' },
    successIcon: { alignItems: 'center', marginBottom: 16 },
    successTxt: { fontSize: 16, fontWeight: '600', color: colors.success, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginBottom: 8 },
    successSub: { fontSize: 14, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  });

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D1B2A', '#1565C0']} style={s.gradient}>
        <View style={s.inner}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.iconWrap}>
            <MaterialCommunityIcons name="lock-reset" size={40} color="#fff" />
          </View>
          <Text style={s.title}>Forgot{'\n'}Password?</Text>
          <Text style={s.subtitle}>Enter your registered email address to receive a password reset link.</Text>

          <View style={s.card}>
            {sent ? (
              <>
                <View style={s.successIcon}>
                  <Feather name="check-circle" size={48} color={colors.success} />
                </View>
                <Text style={s.successTxt}>Reset Link Sent!</Text>
                <Text style={s.successSub}>Check your email inbox for the password reset instructions.</Text>
                <TouchableOpacity style={[s.btn, { marginTop: 20 }]} onPress={() => router.replace('/auth/login')} activeOpacity={0.85}>
                  <LinearGradient colors={['#1565C0', '#0D47A1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnInner}>
                    <Text style={s.btnTxt}>Back to Login</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.lbl}>Email Address</Text>
                <View style={s.inputRow}>
                  <Feather name="mail" size={17} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                  <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="your@email.lk" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" />
                </View>
                <TouchableOpacity style={s.btn} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient colors={['#1565C0', '#0D47A1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnInner}>
                    {loading && <ActivityIndicator color="#fff" size="small" />}
                    <Text style={s.btnTxt}>{loading ? 'Sending…' : 'Send Reset Link'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={s.backLink} onPress={() => router.back()}>
                  <Text style={s.backLinkTxt}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
