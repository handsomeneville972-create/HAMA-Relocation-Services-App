import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Image, Animated, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LiquidGlass } from '../components/LiquidGlass';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { uploadAvatar, deleteUserAvatars } from '../services/uploadService';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

export const EditProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser, currentUserId, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser.name);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    setIsPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
        setHasChanges(true);
      }
    } finally {
      setIsPicking(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    setIsPicking(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
        setHasChanges(true);
      }
    } finally {
      setIsPicking(false);
    }
  };

  const handleSave = async () => {
    if (!currentUserId || !hasChanges) return;

    setIsSaving(true);
    try {
      let avatarUrl = currentUser.avatar;

      if (avatarUri && avatarUri !== currentUser.avatar) {
        const result = await uploadAvatar(currentUserId, avatarUri);
        if ('error' in result) {
          return;
        }
        avatarUrl = result.url;
        deleteUserAvatars(currentUserId);
      }

      updateProfile({ name: displayName.trim() || currentUser.name, avatar: avatarUrl });
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  const hasNameChanged = displayName.trim() !== currentUser.name;
  const hasAvatarChanged = avatarUri !== null && avatarUri !== currentUser.avatar;
  const canSave = (hasNameChanged || hasAvatarChanged) && !isSaving;

  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : currentUser.avatar
      ? { uri: currentUser.avatar }
      : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>Save</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
              <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarBorder}>
                {avatarSource ? (
                  <Image source={avatarSource} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={40} color={COLORS.textTertiary} />
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>

            {/* Photo source buttons */}
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Ionicons name="images-outline" size={18} color={COLORS.primary} />
                <Text style={styles.photoButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
                <Text style={styles.photoButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <LiquidGlass variant="elevated">
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Display Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={COLORS.textTertiary} />
                  <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={(t) => { setDisplayName(t); setHasChanges(true); }}
                    placeholder="Your display name"
                    placeholderTextColor={COLORS.textTertiary}
                    autoCapitalize="words"
                    maxLength={50}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.textTertiary} />
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={currentUser.email}
                    editable={false}
                  />
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name={currentUser.emailVerified ? 'checkmark-circle' : 'time-outline'}
                      size={16}
                      color={currentUser.emailVerified ? COLORS.success : COLORS.warning}
                    />
                  </View>
                </View>
                <Text style={styles.fieldHint}>Email cannot be changed</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color={COLORS.textTertiary} />
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={currentUser.phone || 'Not set'}
                    editable={false}
                  />
                </View>
                <Text style={styles.fieldHint}>Add phone in Settings</Text>
              </View>
            </LiquidGlass>

            {/* Info card */}
            <GlassCard style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Your profile photo and display name are visible to other users.
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
  backButton: {
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
  saveButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.bgCard,
  },
  saveButtonText: {
    ...FONTS.button,
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: COLORS.textTertiary,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
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
  avatarHint: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
  photoActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  photoButtonText: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
  },
  formSection: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.text,
    padding: 0,
  },
  inputDisabled: {
    color: COLORS.textTertiary,
  },
  verifiedBadge: {
    marginLeft: 'auto',
  },
  fieldHint: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: SPACING.sm,
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
