/**
 * HAMA™ Premium Community Upload
 *
 * YouTube Studio-inspired upload experience with Apple-style design.
 * OLED black, white text, orange accents, liquid glass, smooth animations.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Switch,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Image,
  Linking,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../src/constants/theme';
import { publishLocalPost } from '../src/utils/localPosts';
import { useAuth } from '../src/contexts/AuthContext';
import type { CommunityPost, User } from '../src/constants/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// TYPES
// ============================================================

type PostType = 'video' | 'short' | 'image' | 'live';
type Visibility = 'Public' | 'Followers Only' | 'Private' | 'Draft' | 'Scheduled';
type CommentOption = 'allow' | 'followers_only' | 'disable' | 'review';

interface PostFormData {
  type: PostType;
  title: string;
  description: string;
  visibility: Visibility;
  location: string;
  category: string;
  tags: string[];
  thumbnail: string | null;
  comments: CommentOption;
  remix: boolean;
  sensitive: boolean;
  paidPromotion: boolean;
  sponsored: boolean;
  affiliateLinks: boolean;
  ageRestricted: boolean;
  originalContent: boolean;
  watermark: boolean;
  notifyFollowers: boolean;
  crossPost: boolean;
  allowEmbedding: boolean;
  scheduleDate: Date | null;
}

// ============================================================
// CONSTANTS
// ============================================================

const POST_TYPES: { key: PostType; label: string; icon: string; desc: string; formats: string; maxSize: string; maxDuration?: string }[] = [
  { key: 'video', label: 'Video', icon: 'videocam', desc: 'Upload long-form video content', formats: 'MP4, MOV, AVI, MKV, WEBM', maxSize: '2GB', maxDuration: '60 min' },
  { key: 'short', label: 'Short', icon: 'flash', desc: 'Vertical videos up to 90 seconds', formats: 'MP4, MOV', maxSize: '500MB', maxDuration: '90 sec' },
  { key: 'image', label: 'Image', icon: 'image', desc: 'Photos and carousel posts', formats: 'JPG, PNG, WEBP, HEIC', maxSize: '50MB' },
  { key: 'live', label: 'Live', icon: 'radio', desc: 'Live streaming — coming soon', formats: '—', maxSize: '—' },
];

const CATEGORIES = [
  'House Hunting', 'Moving Experience', 'Rental Tips', 'DIY', 'Furniture',
  'Interior Design', 'Cleaning', 'Landlord Advice', 'Home Renovation',
  'Marketplace', 'Hamisha Squad', 'Announcements', 'News', 'Students', 'Lifestyle',
];

const VISIBILITY_OPTIONS: { key: Visibility; icon: string; desc: string }[] = [
  { key: 'Public', icon: 'globe', desc: 'Anyone can see this post' },
  { key: 'Followers Only', icon: 'people', desc: 'Only your followers can see' },
  { key: 'Private', icon: 'lock-closed', desc: 'Only you can see this' },
  { key: 'Draft', icon: 'document-text', desc: 'Save as draft, not published' },
  { key: 'Scheduled', icon: 'time', desc: 'Publish at a specific time' },
];

const COMMENT_OPTIONS: { key: CommentOption; label: string }[] = [
  { key: 'allow', label: 'Allow comments' },
  { key: 'followers_only', label: 'Followers only' },
  { key: 'disable', label: 'Disable comments' },
  { key: 'review', label: 'Review before publishing' },
];

// ============================================================
// ANIMATED HELPER
// ============================================================

const FadeInView: React.FC<{ children: React.ReactNode; delay?: number; style?: any }> = ({ children, delay = 0, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 60, friction: 8, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};

// ============================================================
// COMPONENT
// ============================================================

export const CreatePostScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  // Form state
  const [formData, setFormData] = useState<PostFormData>({
    type: 'video',
    title: '',
    description: '',
    visibility: 'Public',
    location: '',
    category: '',
    tags: [],
    thumbnail: null,
    comments: 'allow',
    remix: true,
    sensitive: false,
    paidPromotion: false,
    sponsored: false,
    affiliateLinks: false,
    ageRestricted: false,
    originalContent: true,
    watermark: false,
    notifyFollowers: true,
    crossPost: false,
    allowEmbedding: true,
    scheduleDate: null,
  });

  const [tagInput, setTagInput] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const activeType = POST_TYPES.find(t => t.key === formData.type)!;

  // Media state
  const [selectedMedia, setSelectedMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  // Share sheet state
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Permission request functions
  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }, []);

  const requestMediaLibraryPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }, []);

  // Pick media functions
  const pickFromGallery = useCallback(async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please enable media library access in Settings to select files.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: formData.type === 'image' ? ImagePicker.MediaTypeOptions.Images : 
                   formData.type === 'short' ? ImagePicker.MediaTypeOptions.Videos :
                   ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: formData.type === 'short' ? [9, 16] : [16, 9],
      quality: 1,
      videoMaxDuration: formData.type === 'short' ? 90 : 3600,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0]);
      setMediaType(result.assets[0].type === 'image' ? 'image' : 'video');
      setUploadProgress(0);
      simulateUpload();
    }
  }, [formData.type, requestMediaLibraryPermission]);

  const pickFromCamera = useCallback(async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please enable camera access in Settings to take photos/videos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: formData.type === 'image' ? ImagePicker.MediaTypeOptions.Images : 
                   formData.type === 'short' ? ImagePicker.MediaTypeOptions.Videos :
                   ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: formData.type === 'short' ? [9, 16] : [16, 9],
      quality: 1,
      videoMaxDuration: formData.type === 'short' ? 90 : 3600,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0]);
      setMediaType(result.assets[0].type === 'image' ? 'image' : 'video');
      setUploadProgress(0);
      simulateUpload();
    }
  }, [formData.type, requestCameraPermission]);

  const pickFromFiles = useCallback(async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please enable file access in Settings to pick files.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0]);
      setMediaType(result.assets[0].type === 'image' ? 'image' : 'video');
      setUploadProgress(0);
      simulateUpload();
    }
  }, [requestMediaLibraryPermission]);

  const clearMedia = useCallback(() => {
    setSelectedMedia(null);
    setMediaType(null);
    setUploadProgress(0);
  }, []);

  const simulateUpload = useCallback(() => {
    setUploading(true);
    setUploadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploading(false);
      }
      setUploadProgress(Math.min(progress, 100));
      Animated.timing(progressAnim, { toValue: Math.min(progress, 100) / 100, duration: 300, useNativeDriver: false }).start();
    }, 400);
  }, []);

  const handleAddTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && formData.tags.length < 10 && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handlePublish = () => {
    if (!formData.title.trim()) {
      Alert.alert('Title Required', 'Please add a title to your post.');
      return;
    }
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
      publishedPostRef.current = buildPost();
    }, 2000);
  };

  // The post created at publish time (used by View Post and Share).
  const publishedPostRef = useRef<CommunityPost | null>(null);

  const buildPost = useCallback((): CommunityPost => {
    const isVideo = formData.type === 'video' || formData.type === 'short';
    return {
      id: `local-${Date.now()}`,
      user: currentUser,
      type: isVideo ? 'video' : 'photo',
      content: [formData.title, formData.description].filter(Boolean).join('\n\n'),
      image: !isVideo && selectedMedia ? selectedMedia.uri : undefined,
      video: isVideo && selectedMedia ? selectedMedia.uri : undefined,
      likes: 0,
      comments: 0,
      shares: 0,
      bookmarks: 0,
      views: 1,
      isLiked: false,
      isBookmarked: false,
      createdAt: new Date().toISOString(),
      tags: formData.tags,
    };
  }, [currentUser, formData, selectedMedia]);

  const handleViewPost = () => {
    const post = publishedPostRef.current ?? buildPost();
    publishLocalPost(post);
    router.push('/(tabs)/Community');
  };

  const getPostLink = () => {
    const post = publishedPostRef.current ?? buildPost();
    return `https://hama.co.ke/post/${post.id}`;
  };

  const shareViaUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open app', 'The app could not be opened. Try another option or copy the link instead.');
    });
  };

  const shareToInstagram = async () => {
    await Clipboard.setStringAsync(getPostLink());
    try {
      await Linking.openURL('instagram://share?story_url=');
      Alert.alert('Instagram', 'Your link has been copied. Paste it in your Instagram post.');
    } catch {
      Alert.alert('Instagram not installed', 'Your link has been copied. Paste it in your Instagram post.');
    }
  };

  const copyLink = async () => {
    await Clipboard.setStringAsync(getPostLink());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload</Text>
          <TouchableOpacity style={styles.helpBtn} onPress={() => setShowHelp(true)}>
            <Ionicons name="help-circle-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Create a Post */}
        <FadeInView delay={0}>
          <Text style={styles.sectionTitle}>Create a Post</Text>
          <Text style={styles.sectionSubtitle}>Share your experience, moving journey, home tips, rentals, products, or services with the HAMA community.</Text>
        </FadeInView>

        {/* Content Type Selector */}
        <FadeInView delay={100}>
          <View style={styles.typeTabs}>
            {POST_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[styles.typeTab, formData.type === type.key && styles.typeTabActive]}
                onPress={() => type.key !== 'live' && setFormData(prev => ({ ...prev, type: type.key }))}
                activeOpacity={type.key === 'live' ? 1 : 0.7}
              >
                <Ionicons name={type.icon as any} size={16} color={formData.type === type.key ? COLORS.primary : COLORS.textTertiary} />
                <Text style={[styles.typeTabLabel, formData.type === type.key && styles.typeTabLabelActive]}>{type.label}</Text>
                {type.key === 'live' && (
                  <View style={styles.comingSoonTiny}>
                    <Text style={styles.comingSoonTinyText}>Soon</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </FadeInView>

        {/* Upload Area */}
        <FadeInView delay={200}>
          {formData.type === 'live' ? (
            <View style={styles.uploadArea}>
              <Ionicons name="radio-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.uploadTitle}>Live Streaming</Text>
              <Text style={styles.uploadSubtitle}>This feature is coming soon. Join the waiting list to be notified.</Text>
              <TouchableOpacity style={styles.waitlistBtn}>
                <Ionicons name="notifications-outline" size={16} color="#fff" />
                <Text style={styles.waitlistBtnText}>Join Waiting List</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadArea} onPress={pickFromGallery} activeOpacity={0.8}>
              {uploading ? (
                <View style={styles.uploadProgressWrap}>
                  <View style={styles.uploadProgressCircle}>
                    <Text style={styles.uploadProgressText}>{Math.round(uploadProgress)}%</Text>
                  </View>
                  <Text style={styles.uploadTitle}>Uploading...</Text>
                  <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                  </View>
                  <View style={styles.uploadActions}>
                    <TouchableOpacity style={styles.uploadActionBtn} onPress={() => { setUploading(false); setUploadProgress(0); }}>
                      <Ionicons name="close" size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : selectedMedia ? (
                <View style={styles.mediaPreviewWrap}>
                  <View style={styles.mediaPreview}>
                    {mediaType === 'video' ? (
                      <View style={styles.videoPreview}>
                        <Ionicons name="play-circle" size={52} color="#fff" />
                        <Text style={styles.mediaPreviewMeta}>{selectedMedia.duration ? `${Math.round(selectedMedia.duration)}s` : 'Video'}</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: selectedMedia.uri }} style={styles.mediaPreviewImage} />
                    )}
                    <View style={styles.mediaPreviewBadge}>
                      <Ionicons name={mediaType === 'video' ? 'videocam' : 'image'} size={12} color="#fff" />
                      <Text style={styles.mediaPreviewBadgeText}>{mediaType === 'video' ? 'Video' : 'Image'}</Text>
                    </View>
                  </View>
                  <Text style={styles.uploadTitle} numberOfLines={1}>{selectedMedia.fileName ?? 'Selected media'}</Text>
                  <Text style={styles.uploadSubtitle}>{(selectedMedia.fileSize ? (selectedMedia.fileSize / (1024 * 1024)).toFixed(1) : 0) + ' MB · ready to upload'}</Text>
                  <View style={styles.uploadSourcesRow}>
                    <TouchableOpacity style={styles.uploadSourceBtn} onPress={pickFromGallery}>
                      <Ionicons name="images-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.uploadSourceText}>Replace</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.uploadSourceBtn, { borderColor: COLORS.error, borderWidth: 1 }]} onPress={clearMedia}>
                      <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                      <Text style={[styles.uploadSourceText, { color: COLORS.error }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.uploadIconCircle}>
                    <Ionicons name="cloud-upload-outline" size={36} color={COLORS.primary} />
                  </View>
                  <Text style={styles.uploadTitle}>Drag & drop a {activeType.label.toLowerCase()} to upload</Text>
                  <Text style={styles.uploadSubtitle}>Tap to browse or choose a source — your {activeType.label.toLowerCase()} stays private until you publish.</Text>
                  <View style={styles.uploadSourcesRow}>
                    <TouchableOpacity style={styles.uploadSourceBtn} onPress={pickFromGallery}>
                      <Ionicons name="images-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.uploadSourceText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadSourceBtn} onPress={pickFromCamera}>
                      <Ionicons name="camera-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.uploadSourceText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadSourceBtn} onPress={pickFromFiles}>
                      <Ionicons name="folder-open-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.uploadSourceText}>Files</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.uploadFormats}>Supports: {activeType.formats} • Max {activeType.maxSize}{activeType.maxDuration ? ` • Up to ${activeType.maxDuration}` : ''}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </FadeInView>

        {/* Title */}
        <FadeInView delay={300}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Title <Text style={styles.required}>*</Text></Text>
              <Text style={[styles.charCount, formData.title.length >= 90 && styles.charCountWarn]}>{formData.title.length}/100</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Add a title that describes your content"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={formData.title}
              onChangeText={(t) => setFormData(prev => ({ ...prev, title: t }))}
              maxLength={100}
            />
          </View>
        </FadeInView>

        {/* Description */}
        <FadeInView delay={350}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Description</Text>
              <Text style={[styles.charCount, formData.description.length >= 4800 && styles.charCountWarn]}>{formData.description.length}/5000</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Tell people more about your content"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={formData.description}
              onChangeText={(t) => setFormData(prev => ({ ...prev, description: t }))}
              maxLength={5000}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </FadeInView>

        {/* Thumbnail */}
        <FadeInView delay={400}>
          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconWrap, { backgroundColor: 'rgba(255,107,0,0.12)' }]}>
                <Ionicons name="image-outline" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.optionLabel}>Thumbnail</Text>
                <Text style={styles.optionDesc}>Choose or upload a thumbnail (1280×720)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.optionAction}>
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </FadeInView>

        {/* Visibility */}
        <FadeInView delay={450}>
          <TouchableOpacity style={styles.optionRow} onPress={() => setShowVisibilityPicker(true)}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconWrap, { backgroundColor: 'rgba(0,212,170,0.12)' }]}>
                <Ionicons name="globe-outline" size={18} color={COLORS.accent} />
              </View>
              <View>
                <Text style={styles.optionLabel}>Visibility</Text>
                <Text style={styles.optionDesc}>{formData.visibility}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </FadeInView>

        {/* Location */}
        <FadeInView delay={500}>
          <TouchableOpacity style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconWrap, { backgroundColor: 'rgba(255,184,77,0.12)' }]}>
                <Ionicons name="location-outline" size={18} color={COLORS.warning} />
              </View>
              <View>
                <Text style={styles.optionLabel}>Location</Text>
                <Text style={styles.optionDesc}>Add location to help others find your post</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </FadeInView>

        {/* Community Category */}
        <FadeInView delay={550}>
          <TouchableOpacity style={styles.optionRow} onPress={() => setShowCategoryPicker(true)}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconWrap, { backgroundColor: 'rgba(138,180,248,0.12)' }]}>
                <Ionicons name="pricetags-outline" size={18} color="#8AB4F8" />
              </View>
              <View>
                <Text style={styles.optionLabel}>Community Category</Text>
                <Text style={styles.optionDesc}>{formData.category || 'Select a category'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </FadeInView>

        {/* Tags */}
        <FadeInView delay={600}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Tags</Text>
              <Text style={styles.charCount}>{formData.tags.length}/10</Text>
            </View>
            <View style={styles.tagsRow}>
              {formData.tags.map(tag => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                    <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Add a tag"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.tagAddBtn} onPress={handleAddTag}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </FadeInView>

        {/* Comments */}
        <FadeInView delay={650}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { marginBottom: SPACING.sm }]}>Comments</Text>
            <View style={styles.commentsGrid}>
              {COMMENT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.commentOption, formData.comments === opt.key && styles.commentOptionActive]}
                  onPress={() => setFormData(prev => ({ ...prev, comments: opt.key }))}
                >
                  <Text style={[styles.commentOptionText, formData.comments === opt.key && styles.commentOptionTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Remix Settings */}
        <FadeInView delay={700}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Ionicons name="repeat-outline" size={18} color={COLORS.textSecondary} />
              <View>
                <Text style={styles.optionLabel}>Allow Remix</Text>
                <Text style={styles.optionDesc}>Others can share, download, or reuse this content</Text>
              </View>
            </View>
            <Switch
              value={formData.remix}
              onValueChange={(v) => setFormData(prev => ({ ...prev, remix: v }))}
              trackColor={{ false: '#333', true: COLORS.primary + '60' }}
              thumbColor={formData.remix ? COLORS.primary : '#666'}
            />
          </View>
        </FadeInView>

        {/* Advanced Settings */}
        <FadeInView delay={750}>
          <TouchableOpacity style={styles.advancedToggle} onPress={() => setShowAdvanced(!showAdvanced)}>
            <Ionicons name="options-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.advancedToggleText}>Advanced Settings</Text>
            <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.advancedContent}>
              {[
                { key: 'sensitive', label: 'Sensitive content', icon: 'warning-outline' },
                { key: 'paidPromotion', label: 'Paid promotion', icon: 'cash-outline' },
                { key: 'sponsored', label: 'Sponsored', icon: 'ribbon-outline' },
                { key: 'affiliateLinks', label: 'Contains affiliate links', icon: 'link-outline' },
                { key: 'ageRestricted', label: 'Age restricted', icon: 'person-outline' },
                { key: 'originalContent', label: 'Original content', icon: 'finger-print-outline' },
                { key: 'watermark', label: 'Watermark', icon: 'water-outline' },
                { key: 'notifyFollowers', label: 'Notify followers', icon: 'notifications-outline' },
                { key: 'crossPost', label: 'Cross-post', icon: 'share-social-outline' },
                { key: 'allowEmbedding', label: 'Allow embedding', icon: 'code-outline' },
              ].map(item => (
                <View key={item.key} style={styles.toggleRow}>
                  <View style={styles.toggleLeft}>
                    <Ionicons name={item.icon as any} size={16} color={COLORS.textTertiary} />
                    <Text style={styles.toggleLabel}>{item.label}</Text>
                  </View>
                  <Switch
                    value={(formData as any)[item.key]}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, [item.key]: v }))}
                    trackColor={{ false: '#333', true: COLORS.primary + '60' }}
                    thumbColor={(formData as any)[item.key] ? COLORS.primary : '#666'}
                  />
                </View>
              ))}
            </View>
          )}
        </FadeInView>

        {/* Bottom Actions */}
        <FadeInView delay={800} style={styles.bottomActions}>
          <TouchableOpacity style={styles.draftBtn} disabled={publishing}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.publishBtn, publishing && styles.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={publishing}
          >
            {publishing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            )}
            <Text style={styles.publishBtnText}>{publishing ? 'Publishing...' : 'Publish'}</Text>
          </TouchableOpacity>
        </FadeInView>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* ============================================================
          PUBLISHED TOAST OVERLAY
          ============================================================ */}
      {published && (
        <View style={styles.toastOverlay} pointerEvents="box-none">
          <FadeInView delay={100} style={styles.toastCard}>
            <View style={styles.toastIconWrap}>
              <LinearGradient colors={[COLORS.primary, '#FF8A33']} style={styles.toastIconGrad}>
                <Ionicons name="checkmark" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.toastTitle}>Your post has been published!</Text>
            <View style={styles.toastActions}>
              <TouchableOpacity style={styles.toastBtn} onPress={handleViewPost}>
                <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
                <Text style={styles.toastBtnText}>View Post</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toastBtnOutline} onPress={() => setShowShareSheet(true)}>
                <Ionicons name="share-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.toastBtnOutlineText}>Share</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        </View>
      )}

      {/* ============================================================
          MODALS
          ============================================================ */}

      {/* Share Sheet */}
      <Modal visible={showShareSheet} transparent animationType="slide" onRequestClose={() => setShowShareSheet(false)}>
        <View style={styles.shareSheetBackdrop}>
          <Pressable style={styles.shareSheetBackdropHit} onPress={() => setShowShareSheet(false)} />
          <View style={[styles.shareSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.shareSheetHandle} />
            <Text style={styles.shareSheetTitle}>Share your post</Text>
            <Text style={styles.shareSheetSub}>Share your post with friends on social media or copy the link.</Text>
            <View style={styles.shareAppsRow}>
              <TouchableOpacity style={styles.shareApp} onPress={() => shareViaUrl(`https://wa.me/?text=${encodeURIComponent(`${formData.title} — ${getPostLink()}`)}`)}>
                <View style={[styles.shareAppIcon, { backgroundColor: '#25D366' }]}>
                  <Ionicons name="logo-whatsapp" size={24} color="#fff" />
                </View>
                <Text style={styles.shareAppLabel}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareApp} onPress={() => shareViaUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getPostLink())}`)}>
                <View style={[styles.shareAppIcon, { backgroundColor: '#1877F2' }]}>
                  <Ionicons name="logo-facebook" size={24} color="#fff" />
                </View>
                <Text style={styles.shareAppLabel}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareApp} onPress={() => shareViaUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${formData.title} — ${getPostLink()}`)}`)}>
                <View style={[styles.shareAppIcon, { backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="logo-twitter" size={24} color="#fff" />
                </View>
                <Text style={styles.shareAppLabel}>X (Twitter)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareApp} onPress={shareToInstagram}>
                <View style={[styles.shareAppIcon, { backgroundColor: '#C13584' }]}>
                  <Ionicons name="logo-instagram" size={24} color="#fff" />
                </View>
                <Text style={styles.shareAppLabel}>Instagram</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareApp} onPress={() => shareViaUrl(`https://t.me/share/url?url=${encodeURIComponent(getPostLink())}&text=${encodeURIComponent(formData.title)}`)}>
                <View style={[styles.shareAppIcon, { backgroundColor: '#229ED9' }]}>
                  <Ionicons name="paper-plane" size={22} color="#fff" />
                </View>
                <Text style={styles.shareAppLabel}>Telegram</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareApp} onPress={() => shareViaUrl(`mailto:?subject=${encodeURIComponent(formData.title)}&body=${encodeURIComponent(`${formData.title}\n\n${formData.description}\n\n${getPostLink()}`)}`)}>
                <View style={[styles.shareAppIcon, { backgroundColor: '#34C759' }]}>
                  <Ionicons name="mail" size={24} color="#fff" />
                </View>
                <Text style={styles.shareAppLabel}>Email</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.shareCopyBtn} onPress={copyLink}>
              <Ionicons name={linkCopied ? 'checkmark-circle' : 'link-outline'} size={20} color={linkCopied ? '#00D4AA' : COLORS.primary} />
              <Text style={[styles.shareCopyText, linkCopied && { color: '#00D4AA' }]}>
                {linkCopied ? 'Link copied!' : 'Copy Link'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help Bottom Sheet */}
      <Modal visible={showHelp} transparent animationType="slide" onRequestClose={() => setShowHelp(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowHelp(false)}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Upload Help</Text>
            {[
              { icon: 'people-outline', title: 'Community Guidelines', desc: 'Be respectful, no spam, follow HAMA community rules.' },
              { icon: 'videocam-outline', title: 'Supported Content', desc: 'Housing, relocation, marketplace, lifestyle, and community posts.' },
              { icon: 'document-text-outline', title: 'Copyright Rules', desc: 'Only upload content you own or have rights to use.' },
              { icon: 'folder-outline', title: 'File Limits', desc: 'Videos: 2GB / 60min. Shorts: 500MB / 90s. Images: 50MB / 20 per post.' },
              { icon: 'bulb-outline', title: 'Upload Tips', desc: 'Use good lighting, clear audio, and eye-catching thumbnails.' },
              { icon: 'film-outline', title: 'Video Recommendations', desc: '1080p+ resolution, MP4 format, 16:9 aspect ratio.' },
              { icon: 'shield-checkmark-outline', title: 'Safety Policies', desc: 'No harmful, illegal, or explicit content. AI moderation enabled.' },
            ].map((item, i) => (
              <View key={i} style={styles.helpItem}>
                <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.helpItemTitle}>{item.title}</Text>
                  <Text style={styles.helpItemDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowHelp(false)}>
              <Text style={styles.sheetCloseBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Category Picker */}
      <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategoryPicker(false)}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Category</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.sheetOption, formData.category === item && styles.sheetOptionActive]}
                  onPress={() => { setFormData(prev => ({ ...prev, category: item })); setShowCategoryPicker(false); }}
                >
                  <Text style={[styles.sheetOptionText, formData.category === item && styles.sheetOptionTextActive]}>{item}</Text>
                  {formData.category === item && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 400 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Visibility Picker */}
      <Modal visible={showVisibilityPicker} transparent animationType="slide" onRequestClose={() => setShowVisibilityPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowVisibilityPicker(false)}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Visibility</Text>
            {VISIBILITY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sheetOption, formData.visibility === opt.key && styles.sheetOptionActive]}
                onPress={() => { setFormData(prev => ({ ...prev, visibility: opt.key })); setShowVisibilityPicker(false); }}
              >
                <Ionicons name={opt.icon as any} size={20} color={formData.visibility === opt.key ? COLORS.primary : COLORS.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetOptionText, formData.visibility === opt.key && styles.sheetOptionTextActive]}>{opt.key}</Text>
                  <Text style={styles.sheetOptionDesc}>{opt.desc}</Text>
                </View>
                {formData.visibility === opt.key && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingBottom: 0 },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  helpBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },

  // Section
  sectionTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 4 },
  sectionSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18, marginBottom: SPACING.lg },

  // Type tabs
  typeTabs: { flexDirection: 'row', gap: 8, marginBottom: SPACING.lg },
  typeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: '#1C1C1E',
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  typeTabActive: { backgroundColor: 'rgba(255,107,0,0.12)', borderColor: COLORS.primary },
  typeTabLabel: { color: '#666', fontSize: 12, fontWeight: '600' },
  typeTabLabelActive: { color: COLORS.primary },
  comingSoonTiny: {
    backgroundColor: COLORS.primary + '30', borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1, marginLeft: 2,
  },
  comingSoonTinyText: { color: COLORS.primary, fontSize: 7, fontWeight: '700' },

  // Upload area
  uploadArea: {
    backgroundColor: '#1C1C1E', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#2C2C2E',
    borderStyle: 'dashed', padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg,
    minHeight: 200, justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,107,0,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
  },
  uploadTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  uploadSubtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', marginBottom: SPACING.md },
  uploadFormats: { color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', marginTop: SPACING.sm },
  uploadSourcesRow: { flexDirection: 'row', gap: 12, marginBottom: SPACING.sm },
  uploadSourceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#2C2C2E', borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 6,
  },
  uploadSourceText: { color: COLORS.textSecondary, fontSize: 11 },
  uploadProgressWrap: { alignItems: 'center', width: '100%' },
  uploadProgressCircle: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
  },
  uploadProgressText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  progressBarBg: { width: '100%', height: 4, backgroundColor: '#2C2C2E', borderRadius: 2, marginBottom: SPACING.md },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  uploadActions: { flexDirection: 'row', gap: 12 },
  uploadActionBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#2C2C2E',
    justifyContent: 'center', alignItems: 'center',
  },
  waitlistBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 12,
    marginTop: SPACING.sm,
  },
  waitlistBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Media preview
  mediaPreviewWrap: { width: '100%', alignItems: 'center' },
  mediaPreview: { width: '100%', height: 180, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#141414', marginBottom: 12, position: 'relative' },
  mediaPreviewImage: { width: '100%', height: '100%' },
  videoPreview: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  mediaPreviewMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8, fontWeight: '600' },
  mediaPreviewBadge: {
    position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4,
  },
  mediaPreviewBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Inputs
  inputGroup: { marginBottom: SPACING.lg },
  inputLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  inputLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  required: { color: COLORS.primary },
  charCount: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  charCountWarn: { color: COLORS.warning },
  textInput: {
    backgroundColor: '#1C1C1E', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#2C2C2E',
    paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14,
  },
  textArea: { minHeight: 100, paddingTop: 12 },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,107,0,0.12)', borderRadius: RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  tagChipText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  tagInputRow: { flexDirection: 'row', gap: 8 },
  tagAddBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },

  // Option rows
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1C1C1E', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#2C2C2E',
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  optionIconWrap: {
    width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  optionLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  optionDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 },
  optionAction: { padding: 4 },

  // Comments
  commentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  commentOption: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.sm,
    backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#2C2C2E',
  },
  commentOptionActive: { backgroundColor: 'rgba(255,107,0,0.12)', borderColor: COLORS.primary },
  commentOptionText: { color: '#666', fontSize: 12, fontWeight: '600' },
  commentOptionTextActive: { color: COLORS.primary },

  // Toggles
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1C1C1E',
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleLabel: { color: '#fff', fontSize: 13 },

  // Advanced
  advancedToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1C1C1E', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#2C2C2E',
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  advancedToggleText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  advancedContent: { marginBottom: SPACING.md },

  // Bottom actions
  bottomActions: { flexDirection: 'row', gap: 12, marginTop: SPACING.md },
  draftBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1C1C1E', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#2C2C2E',
    paddingVertical: 14,
  },
  draftBtnText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  publishBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14,
  },
  publishBtnDisabled: { opacity: 0.6 },
  publishBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Success
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  successIconWrap: { marginBottom: SPACING.lg },
  successIconGrad: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  successTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  successDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', marginBottom: SPACING.xl },
  successActions: { gap: 12, width: '100%' },
  successBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14,
  },
  successBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  successBtnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1C1C1E', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#2C2C2E',
    paddingVertical: 14,
  },
  successBtnOutlineText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },

  // Toast overlay
  toastOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  toastCard: {
    backgroundColor: '#1C1C1E', borderRadius: 20, borderWidth: 1, borderColor: '#2C2C2E',
    paddingHorizontal: 28, paddingVertical: 24, alignItems: 'center',
    width: '82%', maxWidth: 340,
    shadowColor: '#FF6A00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12,
  },
  toastIconWrap: { marginBottom: SPACING.md },
  toastIconGrad: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  toastTitle: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: SPACING.lg },
  toastActions: { flexDirection: 'row', gap: 10, width: '100%' },
  toastBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 12,
  },
  toastBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  toastBtnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#252528', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#333',
    paddingVertical: 12,
  },
  toastBtnOutlineText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },

  // Share sheet
  shareSheetBackdrop: { flex: 1, justifyContent: 'flex-end' },
  shareSheetBackdropHit: { flex: 1 },
  shareSheet: {
    backgroundColor: '#161618',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
  },
  shareSheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: SPACING.lg,
  },
  shareSheetTitle: { color: '#fff', fontSize: 19, fontWeight: '800', textAlign: 'center' },
  shareSheetSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: SPACING.lg },
  shareAppsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: SPACING.md, marginBottom: SPACING.lg },
  shareApp: { width: '30%', alignItems: 'center', gap: 6 },
  shareAppIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  shareAppLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  shareCopyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1C1C1E', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#2C2C2E',
    paddingVertical: 14,
  },
  shareCopyText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: SPACING.lg, paddingBottom: 40, paddingTop: 12,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginBottom: SPACING.md,
  },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: SPACING.md },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2C2C2E',
  },
  sheetOptionActive: { backgroundColor: 'rgba(255,107,0,0.08)', borderRadius: RADIUS.sm, paddingHorizontal: 8 },
  sheetOptionText: { flex: 1, color: '#fff', fontSize: 15 },
  sheetOptionTextActive: { color: COLORS.primary, fontWeight: '600' },
  sheetOptionDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  sheetCloseBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14,
    alignItems: 'center', marginTop: SPACING.md,
  },
  sheetCloseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  helpItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E',
  },
  helpItemTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  helpItemDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 16 },
});

export default CreatePostScreen;
