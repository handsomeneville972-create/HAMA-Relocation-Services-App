import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/utils/supabaseClient';
import { RADIUS, SPACING, SHADOWS, type ThemeColors } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function UpdatePassword() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setStatus('error');
          setMessage('Invalid or expired link. Please request a new password reset.');
        } else {
          setStatus('form');
        }
      });
    } else {
      setStatus('error');
      setMessage('No reset code found. Please use the link from your email.');
    }
  }, []);

  const handleUpdatePassword = async () => {
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to update password.');
    } else {
      setStatus('success');
      setMessage('Password updated! Redirecting to sign in...');
      setTimeout(() => {
        supabase.auth.signOut();
        router.replace('/Login');
      }, 2000);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.title}>Verifying...</Text>
          </>
        )}
        {status === 'error' && (
          <>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text style={styles.title}>Error</Text>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/Login')}>
              <Text style={styles.buttonText}>Go to Sign In</Text>
            </TouchableOpacity>
          </>
        )}
        {status === 'form' && (
          <>
            <Ionicons name="lock-closed" size={48} color={colors.primary} />
            <Text style={styles.title}>Set New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            {message ? <Text style={styles.errorText}>{message}</Text> : null}
            <TouchableOpacity
              style={[styles.button, (!password || !confirmPassword) && styles.buttonDisabled]}
              onPress={handleUpdatePassword}
              disabled={!password || !confirmPassword}
            >
              <LinearGradient colors={colors.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
                <Text style={styles.buttonText}>Update Password</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
        {status === 'success' && (
          <>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.title}>Password Updated!</Text>
            <Text style={styles.message}>{message}</Text>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 14,
  },
  button: {
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
