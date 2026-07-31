import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Image, Animated, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LiquidGlass, LiquidInput } from '../components/LiquidGlass';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { uploadAvatar, deleteUserAvatars } from '../services/uploadService';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

export const EditProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser, currentUserId, updateProfile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username ?? '');
  const [bio, setBio] = useState(currentUser.bio ?? '');
  const [website, setWebsite] = useState(currentUser.website ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    setIsSaving(true);

    try {
      let avatarUrl = currentUser.avatar;
      let newAvatarFileName: string | undefined;

      if (avatarUri) {
        const result = await uploadAvatar(currentUserId, avatarUri);
        if ('error' in result) {
          Alert.alert('Upload Failed', result.error);
          setIsSaving(false);
          return;
        }
        avatarUrl = result.url;
        newAvatarFileName = result.fileName;
      }

      const err = await updateProfile({
        name: displayName.trim() || currentUser.name,
        avatar: avatarUrl,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        website: website.trim() || undefined,
      });

      if (err) {
        Alert.alert('Save Failed', err);
        return;
      }

      // Remove old avatar files (never the one just uploaded)
      if (newAvatarFileName) {
        await deleteUserAvatars(currentUserId, newAvatarFileName);
      }

      await refreshProfile();
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = hasChanges() && !isSaving;
  const picSource = avatarUri ? { uri: avatarUri } : currentUser.avatar ? { uri: currentUser.avatar } : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
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
              <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.photoBorder}>
                {picSource ? (
                  <Image source={picSource} style={styles.photo} />
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
                    placeholderTextColor={COLORS.textTertiary}
                    autoCapitalize="words"
                    maxLength={50}
                  />
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
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
                    placeholderTextColor={COLORS.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={30}
                  />
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
                </TouchableOpacity>
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
                    placeholderTextColor={COLORS.textTertiary}
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
                  <Ionicons name="link-outline" size={18} color={COLORS.textTertiary} />
                  <TextInput
                    style={styles.input}
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="Add a link"
                    placeholderTextColor={COLORS.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
                </TouchableOpacity>
              </View>
            </LiquidGlass>

            {/* Info */}
            <GlassCard style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Your name, @username, bio, and photo are visible to other users on the platform.
                </Text>
              </View>
            </GlassCard>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.bgCard,
  },
  saveBtnText: {
    ...FONTS.button,
    color: '#fff',
  },
  saveBtnTextDisabled: {
    color: COLORS.textTertiary,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
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
  form: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  fieldRow: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
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
  input: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.text,
    padding: 0,
  },
  atSign: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '700',
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
    color: COLORS.textTertiary,
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
    color: COLORS.textTertiary,
    lineHeight: 18,
  },
});
