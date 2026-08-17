import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../contexts/AuthContext';
import { sanitizeInput } from '../utils/sanitize';
import { validatePassword, PASSWORD_REQUIREMENTS } from '../utils/validation';
import { RADIUS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { BlurText, FadeInView } from '../components/BlurText';

const BG_IMAGE = require('../../assets/login-bg.jpg');

type EmailMode = 'login' | 'signup';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { signIn, signUp, isLoading } = useAuth();

  const [emailMode, setEmailMode] = useState<EmailMode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const passwordValidation = emailMode === 'signup' ? validatePassword(password) : null;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = emailMode === 'login' ? password.length >= 1 : passwordValidation?.isValid ?? true;
  const doPasswordsMatch = password === confirmPassword;
  const canSubmit = isValidEmail && isPasswordValid && (emailMode === 'login' || doPasswordsMatch);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isLoading) return;
    setErrorMsg('');
    try {
      if (emailMode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: any) {
      const message =
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : err.code === 'auth/weak-password'
          ? passwordValidation?.message ?? 'Password does not meet requirements.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : err.code === 'auth/invalid-email'
          ? 'Please enter a valid email address.'
          : err.message?.includes('Password must contain')
          ? err.message
          : err.message || 'Something went wrong. Please try again.';
      setErrorMsg(message);
    }
  }, [emailMode, email, password, canSubmit, isLoading, signIn, signUp, passwordValidation]);

  return (
    <ImageBackground
      source={BG_IMAGE}
      style={styles.root}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FadeInView delay={300} duration={700} slideUp slideDistance={20} style={styles.cardContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                <Image source={require('../../assets/hama-logo.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
            </View>
            <BlurText text="HAMA" variant="h1" delay={100} duration={600} />
            <BlurText text="Find. Move. Settle." variant="caption" delay={300} duration={600} color={colors.textSecondary} />

            <Text style={styles.formTitle}>{emailMode === 'login' ? 'Welcome Back' : 'Create Account'}</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => { setEmail(sanitizeInput(t, 254)); if (errorMsg) setErrorMsg(''); }}
                editable={!isLoading}
              />
              {email.length > 0 && (
                <TouchableOpacity onPress={() => setEmail('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={(t) => { setPassword(sanitizeInput(t, 128, { trim: false, stripSql: false })); if (errorMsg) setErrorMsg(''); }}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {emailMode === 'signup' && password.length > 0 && passwordValidation && (
              <View style={styles.passwordRequirements}>
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const met = passwordValidation.checks[req.key];
                  return (
                    <View key={req.key} style={styles.requirementRow}>
                      <Ionicons name={met ? 'checkmark-circle' : 'ellipse-outline'} size={12} color={met ? colors.success : colors.textTertiary} />
                      <Text style={[styles.requirementText, met && styles.requirementMet]}>{req.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {emailMode === 'signup' && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(sanitizeInput(t, 128, { trim: false, stripSql: false })); if (errorMsg) setErrorMsg(''); }}
                  editable={!isLoading}
                />
                {confirmPassword.length > 0 && (
                  <Ionicons name={doPasswordsMatch ? 'checkmark-circle' : 'close-circle'} size={18} color={doPasswordsMatch ? colors.success : colors.error} />
                )}
              </View>
            )}

            {errorMsg.length > 0 && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, (!canSubmit || isLoading) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={canSubmit && !isLoading ? colors.gradientPremium : [colors.textTertiary, colors.textTertiary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>{emailMode === 'login' ? 'Sign In' : 'Create Account'}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {emailMode === 'login' && (
              <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <View style={styles.toggleRow}>
              <Text style={styles.toggleText}>
                {emailMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity onPress={() => { setEmailMode(prev => prev === 'login' ? 'signup' : 'login'); setErrorMsg(''); setConfirmPassword(''); }} disabled={isLoading}>
                <Text style={styles.toggleLink}>{emailMode === 'login' ? 'Sign Up' : 'Sign In'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </FadeInView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  flex: {
    flex: 1,
    justifyContent: 'center',
  },
  cardContainer: {
    marginHorizontal: 20,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
    gap: 12,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  passwordRequirements: {
    gap: 2,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requirementText: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  requirementMet: {
    color: colors.success,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.25)',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
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
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotLink: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  forgotText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  toggleLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
