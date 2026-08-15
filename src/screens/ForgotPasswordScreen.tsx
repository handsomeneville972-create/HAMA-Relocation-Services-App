import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeInput } from '../utils/sanitize';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

type ResetState = 'idle' | 'sending' | 'sent' | 'error';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [state, setState] = useState<ResetState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleReset = useCallback(async () => {
    if (!isValidEmail) return;

    setState('sending');
    setErrorMsg('');

    try {
      await resetPassword(email);
      setState('sent');
    } catch (err: any) {
      setState('error');
      setErrorMsg(
        err.code === 'auth/user-not-found'
          ? 'No account found with this email.'
          : err.code === 'auth/invalid-email'
          ? 'Please enter a valid email address.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many requests. Please try again later.'
          : 'Failed to send reset email. Please try again.',
      );
    }
  }, [email, isValidEmail, resetPassword]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
              <Ionicons name="lock-open-outline" size={36} color="#fff" />
            </LinearGradient>
          </View>

          {state === 'sent' ? (
            /* -------- Success state -------- */
            <GlassCard>
              <View style={styles.successContent}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={56} color={COLORS.success} />
                </View>
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  A password reset link has been sent to{'\n'}
                  <Text style={styles.successEmail}>{email}</Text>
                </Text>
                <Text style={styles.successHint}>
                  The link is valid for 60 minutes and can only be used once.
                  {'\n'}Check your spam folder if you don't see it.
                </Text>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => navigation.goBack()}
                >
                  <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ) : (
            <>
              <Text style={styles.instruction}>
                Enter the email address associated with your account and we'll send you a link to
                reset your password.
              </Text>

              <GlassCard noPadding>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={COLORS.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={(text) => {
                      const sanitized = sanitizeInput(text, 254);
                      setEmail(sanitized);
                      if (state === 'error') setState('idle');
                    }}
                    editable={state !== 'sending'}
                  />
                  {email.length > 0 && (
                    <TouchableOpacity onPress={() => setEmail('')}>
                      <Ionicons name="close-circle" size={20} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>

              {state === 'error' && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitButton, (!isValidEmail || state === 'sending') && styles.submitButtonDisabled]}
                onPress={handleReset}
                disabled={!isValidEmail || state === 'sending'}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isValidEmail && state !== 'sending' ? COLORS.gradientPremium : [COLORS.textTertiary, COLORS.textTertiary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientButton}
                >
                  {state === 'sending' ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitText}>Send Reset Link</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
content: {
      flex: 1,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.xl,
      maxWidth: 720,
      width: '100%',
      alignSelf: 'center',
    gap: SPACING.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  instruction: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.25)',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  successIcon: {
    marginBottom: SPACING.sm,
  },
  successTitle: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  successText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  successEmail: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  successHint: {
    color: COLORS.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
  doneButton: {
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
