import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../src/constants/theme';

type PostType = 'video' | 'short' | 'image' | 'live';

const POST_TYPES: { key: PostType; label: string; icon: string }[] = [
  { key: 'video', label: 'Video', icon: 'videocam' },
  { key: 'short', label: 'Short', icon: 'flash' },
  { key: 'image', label: 'Image', icon: 'image' },
  { key: 'live', label: 'Live', icon: 'radio' },
];

export const CreatePostScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeType, setActiveType] = useState<PostType>('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('Public');

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload</Text>
          <TouchableOpacity style={styles.helpBtn}>
            <Ionicons name="help-circle-outline" size={26} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Coming Soon Banner */}
        <View style={styles.comingSoonBanner}>
          <Ionicons name="construct-outline" size={18} color={COLORS.primary} />
          <Text style={styles.comingSoonBannerText}>Coming Soon</Text>
          <Text style={styles.comingSoonBannerDesc}>This feature is under development</Text>
        </View>

        {/* Title Section */}
        <Text style={styles.sectionTitle}>Create a post</Text>
        <Text style={styles.sectionSubtitle}>Share your experience, tips, or stories with the HAMA community.</Text>

        {/* Post Type Tabs */}
        <View style={styles.typeTabs}>
          {POST_TYPES.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.typeTab, activeType === type.key && styles.typeTabActive]}
              onPress={() => setActiveType(type.key)}
            >
              <Ionicons
                name={type.icon as any}
                size={16}
                color={activeType === type.key ? COLORS.primary : COLORS.textTertiary}
              />
              <Text style={[styles.typeTabLabel, activeType === type.key && styles.typeTabLabelActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upload Area */}
        <View style={styles.uploadArea}>
          <View style={styles.uploadIconContainer}>
            <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.uploadTitle}>Drag & drop a {activeType} to upload</Text>
          <Text style={styles.uploadSubtitle}>Your {activeType} will be private until you publish it.</Text>
          <TouchableOpacity style={styles.selectBtn}>
            <Text style={styles.selectBtnText}>Select {activeType}</Text>
          </TouchableOpacity>
          <Text style={styles.uploadFormats}>
            Supports: MP4, MOV, AVI, WEBM • Max 2GB • Up to 60 minutes
          </Text>
        </View>

        {/* Title Input */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>Title (required)</Text>
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Add a title that describes your video"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>Description</Text>
            <Text style={styles.charCount}>{description.length}/5000</Text>
          </View>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Tell people more about your video"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={description}
            onChangeText={setDescription}
            maxLength={5000}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Thumbnail */}
        <TouchableOpacity style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons name="image-outline" size={20} color={COLORS.textSecondary} />
            <View>
              <Text style={styles.optionLabel}>Thumbnail</Text>
              <Text style={styles.optionDesc}>Choose or upload a thumbnail that stands out</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.uploadThumbBtn}>
            <Ionicons name="image-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.uploadThumbText}>Upload thumbnail</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Visibility */}
        <TouchableOpacity style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons name="globe-outline" size={20} color={COLORS.textSecondary} />
            <View>
              <Text style={styles.optionLabel}>Visibility</Text>
              <Text style={styles.optionDesc}>Choose who can see your post</Text>
            </View>
          </View>
          <View style={styles.optionRight}>
            <Ionicons name="globe" size={16} color={COLORS.textSecondary} />
            <Text style={styles.optionValue}>{visibility}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textTertiary} />
          </View>
        </TouchableOpacity>

        {/* Location */}
        <TouchableOpacity style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
            <View>
              <Text style={styles.optionLabel}>Location</Text>
              <Text style={styles.optionDesc}>Add location to help others find your post</Text>
            </View>
          </View>
          <View style={styles.optionRight}>
            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
            <Text style={styles.optionValue}>Add location</Text>
          </View>
        </TouchableOpacity>

        {/* Add to community */}
        <TouchableOpacity style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons name="people-outline" size={20} color={COLORS.textSecondary} />
            <View>
              <Text style={styles.optionLabel}>Add to community</Text>
              <Text style={styles.optionDesc}>Add your post to a topic or group</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* More options */}
        <TouchableOpacity style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons name="ellipsis-horizontal-outline" size={20} color={COLORS.textSecondary} />
            <View>
              <Text style={styles.optionLabel}>More options</Text>
              <Text style={styles.optionDesc}>Tags, categories, comments & more</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.draftBtn}>
            <Ionicons name="document-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.draftBtnText}>Save draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.publishBtn}>
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            <Text style={styles.publishBtnText}>Publish</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
    paddingBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    ...FONTS.h2,
    color: COLORS.text,
  },
  helpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  comingSoonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  comingSoonBannerText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  comingSoonBannerDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 'auto',
  },
  sectionTitle: {
    ...FONTS.h1,
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.lg,
  },
  typeTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  typeTabActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderColor: COLORS.primary,
  },
  typeTabLabel: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  typeTabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  uploadArea: {
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
    borderStyle: 'dashed',
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.bgCard,
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  uploadTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  selectBtn: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.full,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: SPACING.sm,
  },
  selectBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadFormats: {
    color: COLORS.textTertiary,
    fontSize: 11,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  charCount: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  textInput: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  optionDesc: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionValue: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  uploadThumbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  uploadThumbText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.md,
  },
  draftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  draftBtnText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  publishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  publishBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CreatePostScreen;
