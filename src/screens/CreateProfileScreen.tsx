import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { uploadAvatar } from '../services/uploadService';
import { UserAvatar, isDefaultAvatar } from '../components/UserAvatar';
import { supabase } from '../utils/supabaseClient';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { FadeInView } from '../components/BlurText';

const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,30}$/;

export const CreateProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser, currentUserId, updateProfile } = useAuth();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkedFor, setCheckedFor] = useState('');

  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usernameValid = USERNAME_REGEX.test(username.trim());

  // Debounced availability check
  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (!usernameValid || username.trim() === currentUser.username) {
      setUsernameTaken(false);
      setCheckedFor('');
      return;
    }
    setIsChecking(true);
    checkTimer.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('is_username_taken', {
          p_username: username.trim(),
        });
        if (!error) {
          setUsernameTaken(!!data);
          setCheckedFor(username.trim());
        }
      } catch {
        // Leave state as-is on failure
      } finally {
        setIsChecking(false);
      }
    }, 450);
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [username, usernameValid, currentUser.username]);

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') return;

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert('Add a Profile Photo', '', [
      { text: 'Take Photo', onPress: () => pickImage(true) },
      { text: 'Choose from Gallery', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const canContinue = usernameValid && !usernameTaken && !isChecking && !isSaving;

  const handleContinue = async () => {
    if (!currentUserId || !canContinue) return;
    setIsSaving(true);
    setErrorMsg('');

    try {
      // 1. Save profile fields first (username + onboarding flag).
      // Avatar is intentionally not included here — it's uploaded in step 2.
      const updates: Parameters<typeof updateProfile>[0] = {
        name: currentUser.name,
        username: username.trim(),
        onboardingCompleted: true,
      };

      const err = await updateProfile(updates);

      if (err) {
        if (err.toLowerCase().includes('unique') || err.toLowerCase().includes('duplicate')) {
          setUsernameTaken(true);
          setErrorMsg('That username is already taken. Try another one.');
        } else {
          setErrorMsg(err);
        }
        setIsSaving(false);
        return;
      }

      // 2. Upload the photo separately so a photo failure never blocks
      //    the username/onboarding save.
      if (avatarUri) {
        const result = await uploadAvatar(currentUserId, avatarUri);
        if ('error' in result) {
          setErrorMsg(`Your profile was created, but the photo upload failed: ${result.error}`);
        } else {
          await updateProfile({ avatar: result.url });
        }
      }

      navigation.replace('(tabs)');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsSaving(false);
    }
  };

  const picSource = avatarUri ? { uri: avatarUri } : null;
  const showDefault = !avatarUri && isDefaultAvatar(currentUser.avatar);

  const getUsernameHint = () => {
    if (isChecking) return { text: 'Checking availability...', color: COLORS.textTertiary };
    if (!username) return null;
    if (!usernameValid) return { text: '3-30 characters, letters, numbers, dots or underscores.', color: COLORS.textTertiary };
    if (usernameTaken) return { text: 'That username is already taken.', color: COLORS.error };
    if (checkedFor === username.trim()) return { text: 'Username available!', color: COLORS.success };
    return null;
  };
  const usernameHint = getUsernameHint();

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradientNight} style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View style={styles.logoCircle}>
          <Image source={require('../../assets/hama-logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
        <Text style={styles.headerTitle}>Create your profile</Text>
        <Text style={styles.headerSubtitle}>Choose a photo and username so people know it's you.</Text>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FadeInView delay={100} duration={500}>
            {/* Avatar */}
            <View style={styles.photoSection}>
              <TouchableOpacity onPress={handleAvatarPress} style={styles.photoWrapper} activeOpacity={0.8}>
                <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.photoBorder}>
                  {picSource ? (
                    <Image source={picSource} style={styles.photo} />
                  ) : showDefault ? (
                    <UserAvatar uri={currentUser.avatar} size={112} />
                  ) : (
                    <View style={[styles.photo, styles.photoPlaceholder]}>
                      <Ionicons name="person" size={44} color={COLORS.textTertiary} />
                    </View>
                  )}
                </LinearGradient>
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.photoHint}>Add a profile photo</Text>
            </View>

            {/* Username */}
            <View style={styles.form}>
              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>Username</Text>
                <View style={styles.fieldInput}>
                  <Text style={styles.atSign}>@</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="username"
                    placeholderTextColor={COLORS.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={30}
                  />
                  {isChecking ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : usernameValid && !usernameTaken && checkedFor === username.trim() ? (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  ) : null}
                </View>
                {usernameHint && (
                  <Text style={[styles.hint, { color: usernameHint.color }]}>{usernameHint.text}</Text>
                )}
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleContinue}
                disabled={!canContinue}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={canContinue ? COLORS.gradientPrimary : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={[styles.continueText, !canContinue && styles.continueTextDisabled]}>Continue</Text>
                      <Ionicons name="arrow-forward" size={18} color={canContinue ? '#fff' : COLORS.textTertiary} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </FadeInView>
        </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: 8,
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
    marginBottom: SPACING.sm,
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
scrollContent: {
      paddingHorizontal: SPACING.lg,
      maxWidth: 720,
      width: '100%',
      alignSelf: 'center',
    },
  photoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  photo: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  photoPlaceholder: {
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  photoHint: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  form: {
    gap: SPACING.md,
  },
  fieldCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
    gap: 6,
  },
  fieldLabel: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  atSign: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.text,
    paddingVertical: 8,
  },
  hint: {
    ...FONTS.caption,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.3)',
  },
  errorText: {
    flex: 1,
    ...FONTS.caption,
    color: COLORS.error,
    lineHeight: 18,
  },
  continueBtn: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  continueText: {
    ...FONTS.button,
    color: '#fff',
    fontSize: 16,
  },
  continueTextDisabled: {
    color: COLORS.textTertiary,
  },
});
