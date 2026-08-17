import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Image, Animated, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LiquidGlass } from '../components/LiquidGlass';
import { GlassCard } from '../components/GlassCard';
import { UserAvatar, isDefaultAvatar } from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { uploadAvatar, deleteUserAvatars } from '../services/uploadService';
import { supabase } from '../utils/supabaseClient';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,30}$/;

export const EditProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { currentUser, currentUserId, updateProfile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username ?? '');
  const [bio, setBio] = useState(currentUser.bio ?? '');
  const [website, setWebsite] = useState(currentUser.website ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [checkedFor, setCheckedFor] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Reload the latest profile from Supabase when the screen gains focus
  // so saved username/bio/website/avatar always reflect the database.
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);
  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  // Debounced username availability check (mirrors Create Profile)
  const usernameValid = USERNAME_REGEX.test(username.trim());
  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (!username.trim() || username.trim() === currentUser.username) {
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
  }, [username, currentUser.username]);

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
    Alert.alert('Change Profile Photo', '', [
      { text: 'Take Photo', onPress: () => pickImage(true) },
      { text: 'Choose from Gallery', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const hasChanges = () => {
    if (avatarUri) return true;
    if (displayName.trim() !== currentUser.name) return true;
    if ((username ?? '') !== (currentUser.username ?? '')) return true;
    if ((bio ?? '') !== (currentUser.bio ?? '')) return true;
    if ((website ?? '') !== (currentUser.website ?? '')) return true;
    return false;
  };

  const handleSave = async () => {
    if (!currentUserId || !hasChanges()) return;

    // Block save if the entered username is invalid or already taken
    if (username.trim() && !usernameValid) {
      Alert.alert('Invalid Username', 'Use 3-30 characters: letters, numbers, dots, or underscores.');
      return;
    }
    if (username.trim() && usernameTaken) {
      Alert.alert('Username Unavailable', 'That username is already taken. Try another one.');
      return;
    }

    setIsSaving(true);
    let photoError: string | null = null;

    try {
      // 1. Save text fields first — never pass avatar unless a new photo was picked
      const textErr = await updateProfile({
        name: displayName.trim() || currentUser.name,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        website: website.trim() || undefined,
      });

      if (textErr) {
        Alert.alert('Save Failed', textErr);
        return;
      }

      // 2. Upload photo separately so a photo failure never blocks the text save
      if (avatarUri) {
        const result = await uploadAvatar(currentUserId, avatarUri);
        if ('error' in result) {
          photoError = result.error;
        } else {
          const avatarErr = await updateProfile({ avatar: result.url });
          if (avatarErr) {
            photoError = `Photo uploaded but profile update failed: ${avatarErr}`;
          } else {
            await deleteUserAvatars(currentUserId, result.fileName);
          }
        }
      }

      await refreshProfile();

      if (photoError) {
        Alert.alert(
          'Saved',
          `Your details were saved, but the profile photo could not be updated: ${photoError}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert('Saved', 'Your profile has been updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = hasChanges() && !isSaving && !isChecking;
  const usernameHint = (() => {
    if (!username.trim()) return null;
    if (isChecking) return { text: 'Checking availability...', color: colors.textTertiary, icon: null };
    if (!usernameValid) return { text: '3-30 characters, letters, numbers, dots or underscores.', color: colors.textTertiary, icon: null };
    if (usernameTaken) return { text: 'That username is already taken.', color: colors.error, icon: 'close-circle' as const };
    if (checkedFor === username.trim()) return { text: 'Username available!', color: colors.success, icon: 'checkmark-circle' as const };
    return null;
  })();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={colors.gradientNight} style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>Save</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={handleAvatarPress} style={styles.photoWrapper}>
              <LinearGradient colors={colors.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.photoBorder}>
                {avatarUri || !isDefaultAvatar(currentUser.avatar) ? (
                  <Image
                    source={{ uri: avatarUri ?? currentUser.avatar ?? '' }}
                    style={styles.photo}
                  />
                ) : (
                  <UserAvatar uri={currentUser.avatar} size={112} />
                )}
              </LinearGradient>
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change your profile photo</Text>
          </View>

          {/* Fields */}
          <View style={styles.form}>
            <LiquidGlass variant="elevated">
              {/* Display Name */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TouchableOpacity style={styles.fieldInput} activeOpacity={0.7}>
                  <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Your display name"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="words"
                    maxLength={50}
                  />
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Username */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Username</Text>
                <TouchableOpacity style={styles.fieldInput} activeOpacity={0.7}>
                  <Text style={styles.atSign}>@</Text>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="username"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={30}
                  />
                  {isChecking ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : usernameHint?.icon ? (
                    <Ionicons name={usernameHint.icon} size={20} color={usernameHint.color} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
                {usernameHint && (
                  <Text style={[styles.hint, { color: usernameHint.color }]}>{usernameHint.text}</Text>
                )}
              </View>

              <View style={styles.divider} />

              {/* Bio */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Bio</Text>
                <View style={styles.bioArea}>
                  <TextInput
                    style={[styles.input, styles.bioInput]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Describe yourself in 80 characters"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    maxLength={80}
                  />
                  <Text style={styles.charCount}>{bio.length}/80</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Website */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Website</Text>
                <TouchableOpacity style={styles.fieldInput} activeOpacity={0.7}>
                  <Ionicons name="link-outline" size={18} color={colors.textTertiary} />
                  <TextInput
                    style={styles.input}
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="Add a link"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </LiquidGlass>

            {/* Info */}
            <GlassCard style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  Your name, @username, bio, and photo are visible to other users on the platform. Photos are
                  compressed automatically before upload.
                </Text>
              </View>
            </GlassCard>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h3,
    color: colors.text,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: colors.primary,
  },
  saveBtnDisabled: {
    backgroundColor: colors.bgCard,
  },
  saveBtnText: {
    ...FONTS.button,
    color: '#fff',
  },
  saveBtnTextDisabled: {
    color: colors.textTertiary,
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
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    ...FONTS.caption,
    color: colors.textTertiary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  form: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  fieldRow: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    gap: 6,
  },
  fieldLabel: {
    ...FONTS.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    ...FONTS.body,
    color: colors.text,
    padding: 0,
  },
  atSign: {
    ...FONTS.body,
    color: colors.primary,
    fontWeight: '700',
  },
  hint: {
    ...FONTS.caption,
    lineHeight: 16,
  },
  bioArea: {
    gap: 4,
  },
  bioInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    ...FONTS.caption,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  infoCard: {
    marginTop: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: SPACING.sm,
  },
  infoText: {
    flex: 1,
    ...FONTS.caption,
    color: colors.textTertiary,
    lineHeight: 18,
  },
});