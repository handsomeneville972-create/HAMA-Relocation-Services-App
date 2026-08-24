/**
 * HAMA™ Blog Admin Dashboard
 *
 * Full admin screen for managing blog content.
 * Used standalone via /app/BlogAdmin and embedded inside SuperAdminScreen tabs.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GlassCard } from '../components/GlassCard';
import { RADIUS, SPACING, FONTS, SHADOWS, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import {
  generatePropertyDraft,
  generateNeighbourhoodDraft,
  generateMovingTipsDraft,
  type PropertyData,
} from '../services/blogAIDraftService';
import type {
  BlogPost,
  BlogCategory,
  BlogAuthor,
  BlogBlock,
  BlogBlockType,
} from '../constants/types';

// ─── Types ──────────────────────────────────────────────────────────────────

type AdminTab = 'posts' | 'create' | 'categories' | 'analytics';

type PostStatusFilter = 'all' | 'published' | 'draft' | 'scheduled';

interface CategoryWithCount extends BlogCategory {
  postCount: number;
}

interface AnalyticsData {
  totalViews: number;
  totalPosts: number;
  totalComments: number;
  topPosts: { title: string; views: number }[];
  recentEvents: { type: string; postTitle: string; createdAt: string }[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ADMIN_TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: 'posts', label: 'Posts', icon: 'document-text' },
  { key: 'create', label: 'Create', icon: 'add-circle' },
  { key: 'categories', label: 'Categories', icon: 'pricetag' },
  { key: 'analytics', label: 'Analytics', icon: 'analytics' },
];

const STATUS_FILTERS: { key: PostStatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'scheduled', label: 'Scheduled' },
];

const STATUS_COLORS: Record<string, string> = {
  published: '#00D4AA',
  draft: '#FFB84D',
  scheduled: '#5E9EFF',
};

const BLOCK_TYPE_OPTIONS: { type: BlogBlockType; icon: string; label: string }[] = [
  { type: 'heading', icon: 'text', label: 'Heading' },
  { type: 'paragraph', icon: 'document-text', label: 'Paragraph' },
  { type: 'callout', icon: 'information-circle', label: 'Callout' },
  { type: 'list', icon: 'list', label: 'List' },
  { type: 'image', icon: 'image', label: 'Image' },
  { type: 'divider', icon: 'remove', label: 'Divider' },
];

const CALLOUT_TONES: { key: string; label: string; color: string }[] = [
  { key: 'info', label: 'Info', color: '#5E9EFF' },
  { key: 'tip', label: 'Tip', color: '#00D4AA' },
  { key: 'warning', label: 'Warning', color: '#FFB84D' },
  { key: 'success', label: 'Success', color: '#00D4AA' },
];

const DEFAULT_FORM = {
  title: '',
  excerpt: '',
  coverImageUrl: '',
  categoryId: '',
  authorId: '',
  tags: '',
  status: 'draft' as 'draft' | 'published' | 'scheduled',
  featured: false,
  seoTitle: '',
  seoDescription: '',
  content: [] as BlogBlock[],
};

// ─── Component ──────────────────────────────────────────────────────────────

export const BlogAdminScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useAuth();

  // ─── Access gating ──────────────────────────────────────────────────────
  const isAllowed =
    currentUser?.role === 'admin' || currentUser?.role === 'hamisha_squad';

  // ─── Tab state ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<AdminTab>('posts');

  // ─── Posts state ────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PostStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Form state (create / edit) ────────────────────────────────────────
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [saving, setSaving] = useState(false);
  const [blockEditorVisible, setBlockEditorVisible] = useState(false);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [blockTypePickerVisible, setBlockTypePickerVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiDraftType, setAiDraftType] = useState<'property' | 'neighbourhood' | 'moving'>('property');
  const [aiPropertyName, setAiPropertyName] = useState('');
  const [aiPropertyDesc, setAiPropertyDesc] = useState('');
  const [aiPropertyLocation, setAiPropertyLocation] = useState('');
  const [aiPropertyType, setAiPropertyType] = useState('apartment');
  const [aiPropertyBedrooms, setAiPropertyBedrooms] = useState('');
  const [aiPropertyBathrooms, setAiPropertyBathrooms] = useState('');
  const [aiNeighbourhoodName, setAiNeighbourhoodName] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // ─── Categories tab state ──────────────────────────────────────────────
  const [categoriesWithCount, setCategoriesWithCount] = useState<CategoryWithCount[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('folder-outline');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [catLoading, setCatLoading] = useState(false);

  // ─── Analytics state ───────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ─── Fetch helpers ─────────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, category:blog_categories(*), author:blog_authors(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts((data as unknown as BlogPost[]) ?? []);
    } catch (e: any) {
      console.warn('[BlogAdmin] fetchPosts error:', e?.message);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('blog_categories')
        .select('*')
        .order('position', { ascending: true });
      setCategories((data as unknown as BlogCategory[]) ?? []);
    } catch (e: any) {
      console.warn('[BlogAdmin] fetchCategories error:', e?.message);
    }
  }, []);

  const fetchAuthors = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('blog_authors')
        .select('*')
        .order('name', { ascending: true });
      setAuthors((data as unknown as BlogAuthor[]) ?? []);
    } catch (e: any) {
      console.warn('[BlogAdmin] fetchAuthors error:', e?.message);
    }
  }, []);

  const fetchCategoriesWithCount = useCallback(async () => {
    setCatLoading(true);
    try {
      const { data: cats } = await supabase
        .from('blog_categories')
        .select('*')
        .order('position', { ascending: true });
      const { data: counts } = await supabase
        .from('blog_posts')
        .select('category_id');
      const countMap: Record<string, number> = {};
      (counts ?? []).forEach((row: any) => {
        const id = row.category_id;
        if (id) countMap[id] = (countMap[id] || 0) + 1;
      });
      setCategoriesWithCount(
        ((cats as unknown as BlogCategory[]) ?? []).map(c => ({
          ...c,
          postCount: countMap[c.id] || 0,
        })),
      );
    } catch (e: any) {
      console.warn('[BlogAdmin] fetchCategoriesWithCount error:', e?.message);
    } finally {
      setCatLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const [postsRes, viewsRes, commentsRes, eventsRes] = await Promise.all([
        supabase.from('blog_posts').select('id, title, views'),
        supabase.from('blog_posts').select('views'),
        supabase.from('blog_comments').select('id'),
        supabase
          .from('blog_events')
          .select('type, post_id, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const allPosts = (postsRes.data ?? []) as any[];
      const totalViews = (viewsRes.data ?? []).reduce(
        (sum: number, p: any) => sum + (p.views ?? 0),
        0,
      );
      const totalComments = (commentsRes.data ?? []).length;

      const topPosts = allPosts
        .sort((a: any, b: any) => (b.views ?? 0) - (a.views ?? 0))
        .slice(0, 10)
        .map((p: any) => ({ title: p.title, views: p.views ?? 0 }));

      const postTitleMap: Record<string, string> = {};
      allPosts.forEach((p: any) => {
        postTitleMap[p.id] = p.title;
      });

      const recentEvents = (eventsRes.data ?? []).map((e: any) => ({
        type: e.type,
        postTitle: postTitleMap[e.post_id] ?? 'Unknown',
        createdAt: e.created_at,
      }));

      setAnalytics({
        totalViews,
        totalPosts: allPosts.length,
        totalComments,
        topPosts,
        recentEvents,
      });
    } catch (e: any) {
      console.warn('[BlogAdmin] fetchAnalytics error:', e?.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // ─── Initial load ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAllowed) return;
    fetchPosts();
    fetchCategories();
    fetchAuthors();
  }, [isAllowed, fetchPosts, fetchCategories, fetchAuthors]);

  useEffect(() => {
    if (activeTab === 'categories') fetchCategoriesWithCount();
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab, fetchCategoriesWithCount, fetchAnalytics]);

  // ─── Role gate ─────────────────────────────────────────────────────────

  if (!isAllowed) {
    return (
      <View style={[styles.accessDenied, { paddingTop: insets.top + SPACING.xxl }]}>
        <Ionicons name="lock-closed" size={64} color={colors.error} />
        <Text style={[styles.accessDeniedTitle, { color: colors.error }]}>
          Access Denied
        </Text>
        <Text style={[styles.accessDeniedText, { color: colors.textTertiary }]}>
          You do not have permission to access the Blog Admin panel.
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Filtered posts ────────────────────────────────────────────────────

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [posts, statusFilter, searchQuery]);

  // ─── Form helpers ──────────────────────────────────────────────────────

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingPostId(null);
  };

  const loadPostForEdit = (post: BlogPost) => {
    setEditingPostId(post.id);
    setForm({
      title: post.title,
      excerpt: post.excerpt ?? '',
      coverImageUrl: post.coverImageUrl ?? '',
      categoryId: post.categoryId ?? '',
      authorId: post.authorId ?? '',
      tags: (post.tags ?? []).join(', '),
      status: post.status,
      featured: post.featured,
      seoTitle: post.seoTitle ?? '',
      seoDescription: post.seoDescription ?? '',
      content: post.content ?? [],
    });
    setActiveTab('create');
  };

  const handleSavePost = async () => {
    if (!form.title.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    setSaving(true);
    try {
      const slug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const payload: Record<string, any> = {
        title: form.title.trim(),
        slug: editingPostId ? undefined : slug,
        excerpt: form.excerpt.trim() || null,
        cover_image_url: form.coverImageUrl.trim() || null,
        category_id: form.categoryId || null,
        author_id: form.authorId || null,
        tags: form.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        status: form.status,
        featured: form.featured,
        seo_title: form.seoTitle.trim() || null,
        seo_description: form.seoDescription.trim() || null,
        content: form.content,
        updated_at: new Date().toISOString(),
        published_at:
          form.status === 'published' && !editingPostId
            ? new Date().toISOString()
            : undefined,
      };

      if (editingPostId) {
        delete payload.slug;
        const { error } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', editingPostId);
        if (error) throw error;
        Alert.alert('Success', 'Post updated successfully.');
      } else {
        payload.created_at = new Date().toISOString();
        const { error } = await supabase.from('blog_posts').insert(payload);
        if (error) throw error;
        Alert.alert('Success', 'Post created successfully.');
      }

      resetForm();
      fetchPosts();
      setActiveTab('posts');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save post.');
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    try {
      let result: import('../services/blogAIDraftService').AIDraftResult | undefined;
      if (aiDraftType === 'property') {
        const property: PropertyData = {
          id: `prop-${Date.now()}`,
          title: aiPropertyName.trim() || 'Untitled Property',
          description: aiPropertyDesc.trim() || undefined,
          type: aiPropertyType,
          bedrooms: parseInt(aiPropertyBedrooms) || undefined,
          bathrooms: parseInt(aiPropertyBathrooms) || undefined,
          location: aiPropertyLocation.trim() || undefined,
        };
        result = generatePropertyDraft(property);
      } else if (aiDraftType === 'neighbourhood') {
        result = generateNeighbourhoodDraft(aiNeighbourhoodName.trim() || 'Nairobi', []);
      } else {
        result = generateMovingTipsDraft(aiNeighbourhoodName.trim() || undefined);
      }

      if (result) {
        setForm((prev) => ({
          ...prev,
          title: result!.title,
          excerpt: result!.excerpt,
          content: result!.content,
          tags: result!.tags.join(', '),
          seoTitle: result!.seoTitle,
          seoDescription: result!.seoDescription,
        }));
        setAiModalVisible(false);
        Alert.alert('AI Draft Generated', 'Content has been generated. Review and edit before publishing.');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to generate draft.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleDeletePost = (post: BlogPost) => {
    Alert.alert('Delete Post', `Are you sure you want to delete "${post.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('blog_posts')
              .delete()
              .eq('id', post.id);
            if (error) throw error;
            fetchPosts();
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Failed to delete.');
          }
        },
      },
    ]);
  };

  // ─── Block helpers ─────────────────────────────────────────────────────

  const addBlock = (type: BlogBlockType) => {
    const newBlock: BlogBlock = { type };
    if (type === 'heading') newBlock.level = 2;
    if (type === 'list') newBlock.items = [''];
    if (type === 'callout') newBlock.tone = 'info';
    setForm(prev => ({
      ...prev,
      content: [...prev.content, newBlock],
    }));
    setBlockTypePickerVisible(false);
    setEditingBlockIndex(form.content.length);
  };

  const updateBlock = (index: number, updates: Partial<BlogBlock>) => {
    setForm(prev => {
      const content = [...prev.content];
      content[index] = { ...content[index], ...updates };
      return { ...prev, content };
    });
  };

  const deleteBlock = (index: number) => {
    setForm(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index),
    }));
    if (editingBlockIndex === index) setEditingBlockIndex(null);
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= form.content.length) return;
    setForm(prev => {
      const content = [...prev.content];
      const temp = content[index];
      content[index] = content[newIndex];
      content[newIndex] = temp;
      return { ...prev, content };
    });
    if (editingBlockIndex === index) setEditingBlockIndex(newIndex);
    else if (editingBlockIndex === newIndex) setEditingBlockIndex(index);
  };

  // ─── Category helpers ──────────────────────────────────────────────────

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Validation', 'Category name is required.');
      return;
    }
    setAddingCategory(true);
    try {
      const slug = newCategoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const { error } = await supabase.from('blog_categories').insert({
        name: newCategoryName.trim(),
        slug,
        icon: newCategoryIcon,
        position: categoriesWithCount.length,
      });
      if (error) throw error;
      setNewCategoryName('');
      setNewCategoryIcon('folder-outline');
      fetchCategoriesWithCount();
      fetchCategories();
      Alert.alert('Success', 'Category added.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to add category.');
    } finally {
      setAddingCategory(false);
    }
  };

  // ─── Render: Posts Tab ─────────────────────────────────────────────────

  const renderPostsTab = () => (
    <View style={styles.tabContent}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
      >
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              statusFilter === f.key && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {postsLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: SPACING.xxl }} />
      ) : filteredPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No posts found
          </Text>
        </View>
      ) : (
        filteredPosts.map(post => (
          <GlassCard key={post.id} style={styles.postCard}>
            <View style={styles.postCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
                  {post.title}
                </Text>
                {post.excerpt ? (
                  <Text
                    style={[styles.postExcerpt, { color: colors.textTertiary }]}
                    numberOfLines={1}
                  >
                    {post.excerpt}
                  </Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: (STATUS_COLORS[post.status] ?? colors.textTertiary) + '22' },
                ]}
              >
                <Text
                  style={{
                    color: STATUS_COLORS[post.status] ?? colors.textTertiary,
                    fontSize: 11,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {post.status}
                </Text>
              </View>
            </View>

            <View style={styles.postMeta}>
              {post.category && (
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag" size={12} color={colors.textTertiary} />
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                    {post.category.name}
                  </Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="time" size={12} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {new Date(post.updatedAt ?? post.publishedAt ?? '').toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="eye" size={12} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {post.views ?? 0}
                </Text>
              </View>
            </View>

            <View style={styles.postActions}>
              <TouchableOpacity
                style={[styles.postActionBtn, { backgroundColor: colors.primary + '22' }]}
                onPress={() => loadPostForEdit(post)}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={[styles.postActionText, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.postActionBtn, { backgroundColor: colors.error + '22' }]}
                onPress={() => handleDeletePost(post)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={[styles.postActionText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          resetForm();
          setActiveTab('create');
        }}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  // ─── Render: Create / Edit Tab ─────────────────────────────────────────

  const renderBlockCard = (block: BlogBlock, index: number) => {
    const isEditing = editingBlockIndex === index;
    const iconName =
      BLOCK_TYPE_OPTIONS.find(b => b.type === block.type)?.icon ?? 'help';

    return (
      <GlassCard key={`block-${index}`} style={styles.blockCard}>
        <View style={styles.blockCardHeader}>
          <Ionicons
            name={iconName as any}
            size={18}
            color={colors.primary}
            style={{ marginRight: SPACING.sm }}
          />
          <Text style={[styles.blockType, { color: colors.text }]}>
            {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
            {block.level ? ` H${block.level}` : ''}
          </Text>
          <View style={styles.blockReorderBtns}>
            <TouchableOpacity
              onPress={() => moveBlock(index, -1)}
              disabled={index === 0}
            >
              <Ionicons
                name="arrow-up"
                size={16}
                color={index === 0 ? colors.border : colors.textTertiary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => moveBlock(index, 1)}
              disabled={index === form.content.length - 1}
            >
              <Ionicons
                name="arrow-down"
                size={16}
                color={index === form.content.length - 1 ? colors.border : colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={[styles.blockPreview, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {block.text ?? block.src ?? '(no content)'}
        </Text>

        <View style={styles.blockCardActions}>
          <TouchableOpacity
            style={[styles.blockActionBtn, { backgroundColor: colors.primary + '22' }]}
            onPress={() => setEditingBlockIndex(isEditing ? null : index)}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
              {isEditing ? 'Close' : 'Edit'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.blockActionBtn, { backgroundColor: colors.error + '22' }]}
            onPress={() => deleteBlock(index)}
          >
            <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>Delete</Text>
          </TouchableOpacity>
        </View>

        {isEditing && (
          <View style={styles.blockEditArea}>
            {block.type === 'heading' && (
              <>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={block.text ?? ''}
                  onChangeText={t => updateBlock(index, { text: t })}
                  placeholder="Heading text"
                  placeholderTextColor={colors.textTertiary}
                />
                <View style={styles.headingLevelRow}>
                  {([2, 3] as const).map(lvl => (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.headingLevelBtn,
                        block.level === lvl && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => updateBlock(index, { level: lvl })}
                    >
                      <Text
                        style={{
                          color: block.level === lvl ? '#FFF' : colors.textSecondary,
                          fontWeight: '600',
                        }}
                      >
                        H{lvl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {block.type === 'paragraph' && (
              <TextInput
                style={[styles.input, styles.multiline, { color: colors.text, borderColor: colors.border }]}
                value={block.text ?? ''}
                onChangeText={t => updateBlock(index, { text: t })}
                placeholder="Paragraph text"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            )}

            {block.type === 'callout' && (
              <>
                <View style={styles.toneRow}>
                  {CALLOUT_TONES.map(tone => (
                    <TouchableOpacity
                      key={tone.key}
                      style={[
                        styles.toneBtn,
                        block.tone === tone.key && { backgroundColor: tone.color + '33', borderColor: tone.color },
                      ]}
                      onPress={() => updateBlock(index, { tone: tone.key as any })}
                    >
                      <Text
                        style={{
                          color: block.tone === tone.key ? tone.color : colors.textTertiary,
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {tone.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.input, styles.multiline, { color: colors.text, borderColor: colors.border }]}
                  value={block.text ?? ''}
                  onChangeText={t => updateBlock(index, { text: t })}
                  placeholder="Callout text"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </>
            )}

            {block.type === 'list' && (
              <View>
                {(block.items ?? ['']).map((item, itemIdx) => (
                  <View key={itemIdx} style={styles.listItemRow}>
                    <Text style={[styles.listBullet, { color: colors.textTertiary }]}>•</Text>
                    <TextInput
                      style={[styles.input, styles.listItemInput, { color: colors.text, borderColor: colors.border }]}
                      value={item}
                      onChangeText={t => {
                        const items = [...(block.items ?? [''])];
                        items[itemIdx] = t;
                        updateBlock(index, { items });
                      }}
                      placeholder={`Item ${itemIdx + 1}`}
                      placeholderTextColor={colors.textTertiary}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const items = (block.items ?? []).filter((_, i) => i !== itemIdx);
                        if (items.length === 0) items.push('');
                        updateBlock(index, { items });
                      }}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addItemBtn}
                  onPress={() => {
                    const items = [...(block.items ?? []), ''];
                    updateBlock(index, { items });
                  }}
                >
                  <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                  <Text style={[styles.addItemText, { color: colors.primary }]}>Add Item</Text>
                </TouchableOpacity>
              </View>
            )}

            {block.type === 'image' && (
              <>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={block.src ?? ''}
                  onChangeText={t => updateBlock(index, { src: t })}
                  placeholder="Image URL"
                  placeholderTextColor={colors.textTertiary}
                />
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, marginTop: SPACING.sm }]}
                  value={block.caption ?? ''}
                  onChangeText={t => updateBlock(index, { caption: t })}
                  placeholder="Caption (optional)"
                  placeholderTextColor={colors.textTertiary}
                />
              </>
            )}
          </View>
        )}
      </GlassCard>
    );
  };

  const renderCreateTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
      {editingPostId && (
        <GlassCard style={styles.editingBanner}>
          <Ionicons name="create" size={16} color={colors.primary} />
          <Text style={[styles.editingBannerText, { color: colors.primary }]}>
            Editing: {posts.find(p => p.id === editingPostId)?.title ?? 'Post'}
          </Text>
          <TouchableOpacity onPress={resetForm}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </GlassCard>
      )}

      <GlassCard style={styles.formSection}>
        <Text style={[styles.formLabel, { color: colors.text }]}>Title *</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={form.title}
          onChangeText={t => setForm(p => ({ ...p, title: t }))}
          placeholder="Post title"
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={[styles.formLabel, { color: colors.text, marginTop: SPACING.md }]}>Excerpt</Text>
        <TextInput
          style={[styles.input, styles.multiline, { color: colors.text, borderColor: colors.border }]}
          value={form.excerpt}
          onChangeText={t => setForm(p => ({ ...p, excerpt: t }))}
          placeholder="Short description"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={[styles.formLabel, { color: colors.text, marginTop: SPACING.md }]}>
          Cover Image URL
        </Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={form.coverImageUrl}
          onChangeText={t => setForm(p => ({ ...p, coverImageUrl: t }))}
          placeholder="https://..."
          placeholderTextColor={colors.textTertiary}
        />
      </GlassCard>

      <GlassCard style={styles.formSection}>
        <Text style={[styles.formLabel, { color: colors.text }]}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: SPACING.sm }}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                form.categoryId === cat.id && styles.chipActive,
              ]}
              onPress={() =>
                setForm(p => ({
                  ...p,
                  categoryId: p.categoryId === cat.id ? '' : cat.id,
                }))
              }
            >
              <Text
                style={[
                  styles.chipText,
                  form.categoryId === cat.id && styles.chipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.formLabel, { color: colors.text, marginTop: SPACING.md }]}>Author</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: SPACING.sm }}
        >
          {authors.map(author => (
            <TouchableOpacity
              key={author.id}
              style={[
                styles.chip,
                form.authorId === author.id && styles.chipActive,
              ]}
              onPress={() =>
                setForm(p => ({
                  ...p,
                  authorId: p.authorId === author.id ? '' : author.id,
                }))
              }
            >
              <Text
                style={[
                  styles.chipText,
                  form.authorId === author.id && styles.chipTextActive,
                ]}
              >
                {author.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </GlassCard>

      <GlassCard style={styles.formSection}>
        <Text style={[styles.formLabel, { color: colors.text }]}>Tags (comma separated)</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={form.tags}
          onChangeText={t => setForm(p => ({ ...p, tags: t }))}
          placeholder="tip, budget, nairobi"
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={[styles.formLabel, { color: colors.text, marginTop: SPACING.md }]}>Status</Text>
        <View style={styles.statusRow}>
          {(['draft', 'published', 'scheduled'] as const).map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusBtn,
                form.status === s && {
                  backgroundColor: (STATUS_COLORS[s] ?? colors.textTertiary) + '33',
                  borderColor: STATUS_COLORS[s] ?? colors.textTertiary,
                },
              ]}
              onPress={() => setForm(p => ({ ...p, status: s }))}
            >
              <Text
                style={{
                  color: form.status === s
                    ? (STATUS_COLORS[s] ?? colors.text)
                    : colors.textTertiary,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.featuredRow}>
          <Text style={[styles.formLabel, { color: colors.text, marginTop: 0 }]}>Featured</Text>
          <Switch
            value={form.featured}
            onValueChange={v => setForm(p => ({ ...p, featured: v }))}
            trackColor={{ false: colors.border, true: colors.primary + '55' }}
            thumbColor={form.featured ? colors.primary : colors.textTertiary}
          />
        </View>
      </GlassCard>

      {/* Content Blocks Editor */}
      <GlassCard style={styles.formSection}>
        <View style={styles.blocksHeader}>
          <Text style={[styles.formLabel, { color: colors.text, marginTop: 0, marginBottom: 0 }]}>
            Content Blocks
          </Text>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <TouchableOpacity
              style={[styles.addBlockBtn, { backgroundColor: colors.accent }]}
              onPress={() => setAiModalVisible(true)}
            >
              <Ionicons name="sparkles" size={14} color="#FFF" />
              <Text style={styles.addBlockBtnText}>AI Generate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBlockBtn, { backgroundColor: colors.primary }]}
              onPress={() => setBlockTypePickerVisible(true)}
            >
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.addBlockBtnText}>Add Block</Text>
            </TouchableOpacity>
          </View>
        </View>

        {form.content.length === 0 ? (
          <Text style={[styles.emptyBlocksText, { color: colors.textTertiary }]}>
            No content blocks yet. Add one to build your post.
          </Text>
        ) : (
          form.content.map((block, idx) => renderBlockCard(block, idx))
        )}
      </GlassCard>

      {/* SEO */}
      <GlassCard style={styles.formSection}>
        <Text style={[styles.formLabel, { color: colors.text }]}>SEO Title</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={form.seoTitle}
          onChangeText={t => setForm(p => ({ ...p, seoTitle: t }))}
          placeholder="SEO optimized title"
          placeholderTextColor={colors.textTertiary}
        />
        <Text style={[styles.formLabel, { color: colors.text, marginTop: SPACING.md }]}>
          SEO Description
        </Text>
        <TextInput
          style={[styles.input, styles.multiline, { color: colors.text, borderColor: colors.border }]}
          value={form.seoDescription}
          onChangeText={t => setForm(p => ({ ...p, seoDescription: t }))}
          placeholder="Meta description"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </GlassCard>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        onPress={handleSavePost}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={18} color="#FFF" />
            <Text style={styles.saveBtnText}>
              {editingPostId ? 'Update Post' : 'Save Post'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  // ─── Render: Categories Tab ────────────────────────────────────────────

  const renderCategoriesTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
      <GlassCard style={styles.formSection}>
        <Text style={[styles.formLabel, { color: colors.text }]}>Add New Category</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          placeholder="Category name"
          placeholderTextColor={colors.textTertiary}
        />
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, marginTop: SPACING.sm }]}
          value={newCategoryIcon}
          onChangeText={setNewCategoryIcon}
          placeholder="Icon name (e.g. home-outline)"
          placeholderTextColor={colors.textTertiary}
        />
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: SPACING.md }]}
          onPress={handleAddCategory}
          disabled={addingCategory}
        >
          {addingCategory ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="add-circle" size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>Add Category</Text>
            </>
          )}
        </TouchableOpacity>
      </GlassCard>

      {catLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: SPACING.xxl }} />
      ) : (
        categoriesWithCount.map(cat => (
          <GlassCard key={cat.id} style={styles.categoryCard}>
            <View style={styles.categoryRow}>
              <Ionicons
                name={(cat.icon ?? 'folder-outline') as any}
                size={24}
                color={colors.primary}
              />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                <Text style={[styles.categorySlug, { color: colors.textTertiary }]}>
                  /{cat.slug}
                </Text>
              </View>
              <View
                style={[
                  styles.categoryCountBadge,
                  { backgroundColor: colors.primary + '22' },
                ]}
              >
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                  {cat.postCount}
                </Text>
              </View>
            </View>
          </GlassCard>
        ))
      )}
    </ScrollView>
  );

  // ─── Render: Analytics Tab ─────────────────────────────────────────────

  const renderAnalyticsTab = () => {
    if (analyticsLoading) {
      return (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: SPACING.xxl }} />
      );
    }
    if (!analytics) return null;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
        <View style={styles.analyticsSummaryRow}>
          {[
            { label: 'Total Views', value: analytics.totalViews, icon: 'eye' },
            { label: 'Total Posts', value: analytics.totalPosts, icon: 'document-text' },
            { label: 'Comments', value: analytics.totalComments, icon: 'chatbubble' },
          ].map((stat, i) => (
            <GlassCard key={i} style={styles.analyticsStatCard}>
              <Ionicons name={stat.icon as any} size={20} color={colors.primary} />
              <Text style={[styles.analyticsStatValue, { color: colors.text }]}>
                {stat.value.toLocaleString()}
              </Text>
              <Text style={[styles.analyticsStatLabel, { color: colors.textTertiary }]}>
                {stat.label}
              </Text>
            </GlassCard>
          ))}
        </View>

        <GlassCard style={styles.formSection}>
          <Text style={[styles.formLabel, { color: colors.text, marginBottom: SPACING.md }]}>
            Top Posts by Views
          </Text>
          {analytics.topPosts.length === 0 ? (
            <Text style={{ color: colors.textTertiary }}>No data yet.</Text>
          ) : (
            analytics.topPosts.map((p, i) => {
              const maxViews = analytics.topPosts[0]?.views ?? 1;
              const barWidth = Math.max((p.views / maxViews) * 100, 4);
              return (
                <View key={i} style={styles.topPostRow}>
                  <Text
                    style={[styles.topPostRank, { color: colors.textTertiary }]}
                    numberOfLines={1}
                  >
                    {i + 1}. {p.title}
                  </Text>
                  <View style={styles.topPostBarWrap}>
                    <View
                      style={[
                        styles.topPostBar,
                        { width: `${barWidth}%`, backgroundColor: colors.primary },
                      ]}
                    />
                  </View>
                  <Text style={[styles.topPostViews, { color: colors.primary }]}>
                    {p.views}
                  </Text>
                </View>
              );
            })
          )}
        </GlassCard>

        <GlassCard style={styles.formSection}>
          <Text style={[styles.formLabel, { color: colors.text, marginBottom: SPACING.md }]}>
            Recent Events
          </Text>
          {analytics.recentEvents.length === 0 ? (
            <Text style={{ color: colors.textTertiary }}>No events yet.</Text>
          ) : (
            analytics.recentEvents.slice(0, 10).map((ev, i) => (
              <View key={i} style={styles.eventRow}>
                <Ionicons
                  name={
                    ev.type === 'view'
                      ? 'eye-outline'
                      : ev.type === 'share'
                        ? 'share-outline'
                        : ev.type === 'bookmark'
                          ? 'bookmark-outline'
                          : 'information-circle-outline' as any
                  }
                  size={16}
                  color={colors.textTertiary}
                />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={[styles.eventType, { color: colors.text }]}>
                    {ev.type}
                  </Text>
                  <Text
                    style={[styles.eventPost, { color: colors.textTertiary }]}
                    numberOfLines={1}
                  >
                    {ev.postTitle}
                  </Text>
                </View>
                <Text style={[styles.eventTime, { color: colors.textTertiary }]}>
                  {new Date(ev.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>
    );
  };

  // ─── Main render ──────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Blog Admin</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {ADMIN_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? colors.primary : colors.textTertiary}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === tab.key ? colors.primary : colors.textTertiary,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'posts' && renderPostsTab()}
      {activeTab === 'create' && renderCreateTab()}
      {activeTab === 'categories' && renderCategoriesTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}

      {/* Block Type Picker Modal */}
      <Modal visible={blockTypePickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgElevated }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Block</Text>
            {BLOCK_TYPE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.type}
                style={styles.modalOption}
                onPress={() => addBlock(opt.type)}
              >
                <Ionicons name={opt.icon as any} size={20} color={colors.primary} />
                <Text style={[styles.modalOptionText, { color: colors.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              onPress={() => setBlockTypePickerVisible(false)}
            >
              <Text style={{ color: colors.textTertiary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Generate Modal */}
      <Modal visible={aiModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgElevated, maxHeight: '80%' }]}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: colors.text }]}>AI Content Generator</Text>

              {/* Draft Type Picker */}
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Content Type</Text>
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
                {[
                  { key: 'property' as const, label: 'Property', icon: 'home' },
                  { key: 'neighbourhood' as const, label: 'Area Guide', icon: 'map' },
                  { key: 'moving' as const, label: 'Moving Tips', icon: 'car' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.filterChip,
                      aiDraftType === opt.key && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                    ]}
                    onPress={() => setAiDraftType(opt.key)}
                  >
                    <Ionicons name={opt.icon as any} size={14} color={aiDraftType === opt.key ? colors.primary : colors.textTertiary} />
                    <Text style={[styles.filterChipText, { color: aiDraftType === opt.key ? colors.primary : colors.textTertiary }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Property Fields */}
              {aiDraftType === 'property' && (
                <>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Property Name *</Text>
                  <TextInput style={[styles.formInput, { color: colors.text, borderColor: colors.border }]} value={aiPropertyName} onChangeText={setAiPropertyName} placeholder="e.g. Modern 2BR Apartment in Kilimani" placeholderTextColor={colors.textTertiary} />
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description</Text>
                  <TextInput style={[styles.formInput, { color: colors.text, borderColor: colors.border, minHeight: 60 }]} value={aiPropertyDesc} onChangeText={setAiPropertyDesc} placeholder="Brief description of the property" placeholderTextColor={colors.textTertiary} multiline />
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Location</Text>
                  <TextInput style={[styles.formInput, { color: colors.text, borderColor: colors.border }]} value={aiPropertyLocation} onChangeText={setAiPropertyLocation} placeholder="e.g. Kilimani, Nairobi" placeholderTextColor={colors.textTertiary} />
                  <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Bedrooms</Text>
                      <TextInput style={[styles.formInput, { color: colors.text, borderColor: colors.border }]} value={aiPropertyBedrooms} onChangeText={setAiPropertyBedrooms} placeholder="2" keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Bathrooms</Text>
                      <TextInput style={[styles.formInput, { color: colors.text, borderColor: colors.border }]} value={aiPropertyBathrooms} onChangeText={setAiPropertyBathrooms} placeholder="2" keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
                    </View>
                  </View>
                </>
              )}

              {/* Neighbourhood Fields */}
              {aiDraftType === 'neighbourhood' && (
                <>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Neighbourhood Name *</Text>
                  <TextInput style={[styles.formInput, { color: colors.text, borderColor: colors.border }]} value={aiNeighbourhoodName} onChangeText={setAiNeighbourhoodName} placeholder="e.g. Karen, Westlands, Kilimani" placeholderTextColor={colors.textTertiary} />
                </>
              )}

              {/* Moving Tips Fields */}
              {aiDraftType === 'moving' && (
                <>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Target Neighbourhood (optional)</Text>
                  <TextInput style={[styles.formInput, { color: colors.text, borderColor: colors.border }]} value={aiNeighbourhoodName} onChangeText={setAiNeighbourhoodName} placeholder="e.g. Nairobi (leave blank for general)" placeholderTextColor={colors.textTertiary} />
                </>
              )}

              {/* Generate Button */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.accent, marginTop: SPACING.md }]}
                onPress={handleAIGenerate}
                disabled={aiGenerating}
              >
                {aiGenerating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#FFF" />
                    <Text style={styles.saveBtnText}>Generate Draft</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border, marginTop: SPACING.sm }]}
                onPress={() => setAiModalVisible(false)}
              >
                <Text style={{ color: colors.textTertiary }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    // Access denied
    accessDenied: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
    },
    accessDeniedTitle: {
      ...FONTS.h2,
      marginTop: SPACING.md,
    },
    accessDeniedText: {
      ...FONTS.body,
      textAlign: 'center',
      marginTop: SPACING.sm,
    },
    backBtn: {
      marginTop: SPACING.lg,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.md,
    },
    backBtnText: {
      color: '#FFF',
      fontWeight: '600',
    },
    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    headerBackBtn: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...FONTS.h2,
    },
    // Tab bar
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: SPACING.sm,
    },
    tabItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabItemActive: {
      borderBottomColor: colors.primary,
    },
    tabLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    // Tab content
    tabContent: {
      flex: 1,
    },
    // Filters & search
    filterRow: {
      maxHeight: 52,
    },
    filterRowContent: {
      gap: SPACING.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    filterChip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    filterChipActive: {
      backgroundColor: colors.primary + '22',
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textTertiary,
    },
    filterChipTextActive: {
      color: colors.primary,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bgCard,
      gap: SPACING.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    // Empty state
    emptyState: {
      alignItems: 'center',
      marginTop: SPACING.xxxl,
      gap: SPACING.sm,
    },
    emptyText: {
      ...FONTS.body,
    },
    // Post cards
    postCard: {
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
    },
    postCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.sm,
    },
    postTitle: {
      ...FONTS.bodyLarge,
    },
    postExcerpt: {
      ...FONTS.bodySmall,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: RADIUS.full,
    },
    postMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.md,
      marginTop: SPACING.sm,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      ...FONTS.caption,
    },
    postActions: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    postActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADIUS.sm,
    },
    postActionText: {
      fontSize: 13,
      fontWeight: '600',
    },
    // FAB
    fab: {
      position: 'absolute',
      bottom: SPACING.lg,
      right: SPACING.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.lg,
    },
    // Form sections
    formSection: {
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
    },
    formLabel: {
      ...FONTS.bodySmall,
      fontWeight: '600',
      marginBottom: SPACING.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    formInput: {
      borderWidth: 1,
      borderRadius: RADIUS.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      fontSize: 14,
      backgroundColor: colors.bgCard,
      marginBottom: SPACING.sm,
    },
    input: {
      borderWidth: 1,
      borderRadius: RADIUS.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      fontSize: 14,
      backgroundColor: colors.bgCard,
    },
    multiline: {
      minHeight: 80,
    },
    // Chips (category/author picker)
    chip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    chipActive: {
      backgroundColor: colors.primary + '22',
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textTertiary,
    },
    chipTextActive: {
      color: colors.primary,
    },
    // Status row
    statusRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    statusBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    featuredRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: SPACING.md,
    },
    // Block editor
    blocksHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.sm,
    },
    addBlockBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADIUS.sm,
    },
    addBlockBtnText: {
      color: '#FFF',
      fontSize: 13,
      fontWeight: '600',
    },
    emptyBlocksText: {
      ...FONTS.bodySmall,
      textAlign: 'center',
      paddingVertical: SPACING.lg,
    },
    blockCard: {
      marginBottom: SPACING.sm,
    },
    blockCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    blockType: {
      flex: 1,
      ...FONTS.bodySmall,
      fontWeight: '600',
    },
    blockReorderBtns: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    blockPreview: {
      ...FONTS.bodySmall,
      marginTop: SPACING.xs,
    },
    blockCardActions: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginTop: SPACING.sm,
    },
    blockActionBtn: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.sm,
    },
    blockEditArea: {
      marginTop: SPACING.md,
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    headingLevelRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginTop: SPACING.sm,
    },
    headingLevelBtn: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toneRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    toneBtn: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    listItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      marginBottom: SPACING.xs,
    },
    listBullet: {
      fontSize: 16,
    },
    listItemInput: {
      flex: 1,
    },
    addItemBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: SPACING.xs,
    },
    addItemText: {
      fontSize: 13,
      fontWeight: '600',
    },
    // Save button
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      marginHorizontal: SPACING.md,
      marginTop: SPACING.md,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
    },
    saveBtnText: {
      color: '#FFF',
      ...FONTS.button,
    },
    // Editing banner
    editingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
    },
    editingBannerText: {
      flex: 1,
      ...FONTS.bodySmall,
      fontWeight: '600',
    },
    // Categories tab
    categoryCard: {
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryName: {
      ...FONTS.bodyLarge,
    },
    categorySlug: {
      ...FONTS.caption,
    },
    categoryCountBadge: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: RADIUS.full,
      minWidth: 32,
      alignItems: 'center',
    },
    // Analytics tab
    analyticsSummaryRow: {
      flexDirection: 'row',
      paddingHorizontal: SPACING.md,
      gap: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    analyticsStatCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: SPACING.md,
    },
    analyticsStatValue: {
      ...FONTS.h2,
      marginTop: SPACING.xs,
    },
    analyticsStatLabel: {
      ...FONTS.caption,
      marginTop: 2,
    },
    topPostRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
      gap: SPACING.sm,
    },
    topPostRank: {
      width: 140,
      ...FONTS.bodySmall,
    },
    topPostBarWrap: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    topPostBar: {
      height: '100%',
      borderRadius: 4,
    },
    topPostViews: {
      width: 40,
      textAlign: 'right',
      ...FONTS.bodySmall,
      fontWeight: '600',
    },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: SPACING.sm,
    },
    eventType: {
      ...FONTS.bodySmall,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    eventPost: {
      ...FONTS.caption,
    },
    eventTime: {
      ...FONTS.caption,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
    },
    modalContent: {
      width: '100%',
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    modalTitle: {
      ...FONTS.h3,
      marginBottom: SPACING.md,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalOptionText: {
      ...FONTS.body,
    },
    modalCancelBtn: {
      marginTop: SPACING.md,
      paddingVertical: SPACING.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: RADIUS.sm,
    },
  });
