import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { LiquidGlass } from '../components/LiquidGlass';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useAuth } from '../contexts/AuthContext';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { ROLE_LABELS, VERIFICATION_LABELS } from '../constants/labels';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

interface WorkspacePlan {
  id: string;
  role: 'house_seeker' | 'landlord' | 'seller' | 'service_provider';
  title: string;
  icon: string;
  description: string;
  color: string;
  benefits: string[];
  verificationRequired: boolean;
  verificationStatus: 'pending' | 'in_progress' | 'verified' | 'rejected';
  subscription: {
    name: string;
    price: number;
    interval: 'free' | 'monthly' | 'yearly';
    active: boolean;
  };
  activatedAt?: Date;
  features: string[];
}

export const WorkspacePlansScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUserId } = useAuth();
  const { showPremiumModal } = useEarlyAccess();
  const [isLoading, setIsLoading] = useState(true);
  const [activeWorkspaces, setActiveWorkspaces] = useState<Set<string>>(new Set());
  const [workspacePlans, setWorkspacePlans] = useState<WorkspacePlan[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Mock workspace plans data
  const WORKSPACE_PLANS: WorkspacePlan[] = [
    {
      id: 'house_seeker',
      role: 'house_seeker',
      title: 'House Seeker',
      icon: 'home-outline',
      description: 'Your default workspace for finding properties, booking services, and connecting with landlords.',
      color: COLORS.primary,
      benefits: [
        'Access to all property listings and property details',
        'Message landlords and schedule viewings',
        'Book service providers directly',
        'Create and save search preferences',
        'Virtual property tours and 3D walkthroughs',
      ],
      verificationRequired: false,
      verificationStatus: 'verified',
      subscription: {
        name: 'Free',
        price: 0,
        interval: 'free',
        active: true,
      },
      activatedAt: new Date(),
      features: [
        'Browse properties (max 5 saved)',
        'Message landlords',
        'Book services up to $100',
        'Create wishlists',
        'Basic analytics',
      ],
    },
    {
      id: 'landlord',
      role: 'landlord',
      title: 'Landlord',
      icon: 'business-outline',
      description: 'Advertise rental properties, connect with renters, and manage your portfolio remotely.',
      color: COLORS.secondary,
      benefits: [
        'Property listing with 30-day free advertising',
        'Direct communication with renters',
        'Property analytics and insights',
        'Tenant screening and verification',
        'Automated rent collection setup',
      ],
      verificationRequired: true,
      verificationStatus: 'pending',
      subscription: {
        name: 'Premium',
        price: 2999,
        interval: 'monthly',
        active: false,
      },
      features: [
        '3 property listings included',
        'Custom property search',
        'Tenant messaging',
        'Basic analytics',
        'Document storage',
      ],
    },
    {
      id: 'seller',
      role: 'seller',
      title: 'Seller',
      icon: 'pricetag-outline',
      description: 'Sell properties, manage offers, and connect with real estate agents for your listings.',
      color: COLORS.accent,
      benefits: [
        'Property listing with professional photography',
        'Connected to verified real estate agents',
        'Offer management system',
        'Market analysis and insights',
        'Document verification services',
      ],
      verificationRequired: true,
      verificationStatus: 'in_progress',
      subscription: {
        name: 'Pro',
        price: 4999,
        interval: 'monthly',
        active: false,
      },
      features: [
        'Up to 2 listings',
        'Professional photography package',
        'Offer tracking and management',
        'Market analytics',
        'Document verification',
      ],
    },
    {
      id: 'service_provider',
      role: 'service_provider',
      title: 'Service Provider',
      icon: 'construct-outline',
      description: 'List your services, manage bookings, and connect with customers actively looking for help.',
      color: COLORS.warning,
      benefits: [
        'Professional service profile with ratings',
        'Direct messaging from customers',
        'Booking calendar integration',
        'Payment processing and escrow',
        'Performance analytics and insights',
      ],
      verificationRequired: true,
      verificationStatus: 'pending',
      subscription: {
        name: 'Standard',
        price: 1999,
        interval: 'monthly',
        active: false,
      },
      features: [
        '5 service categories',
        'Online booking system',
        'Mobile app notifications',
        'Basic payment processing',
        'Customer messaging',
      ],
    },
  ];

  useEffect(() => {
    // Initialize data
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Check current user workspace
        if (currentUserId) {
          // Here you would fetch the user's active workspaces from Supabase
          // For now, default to house_seeker
          setActiveWorkspaces(new Set(['house_seeker']));
        }
        setWorkspacePlans(WORKSPACE_PLANS);
      } catch (error) {
        console.error('Failed to initialize workspace plans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [currentUserId]);

  const handleActivateWorkspace = useCallback(async (workspaceId: string) => {
    setIsUpgrading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newActiveWorkspaces = new Set(activeWorkspaces);
      newActiveWorkspaces.add(workspaceId);
      setActiveWorkspaces(newActiveWorkspaces);
      
      // Update local workspace plan state
      const updatedPlans = workspacePlans.map(plan => {
        if (plan.id === workspaceId) {
          return {
            ...plan,
            subscription: {
              ...plan.subscription,
              active: true,
            },
            activatedAt: new Date(),
          };
        }
        return plan;
      });
      setWorkspacePlans(updatedPlans);
    } catch (error) {
      console.error('Failed to activate workspace:', error);
    } finally {
      setIsUpgrading(false);
    }
  }, [activeWorkspaces, workspacePlans]);

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'in_progress':
        return COLORS.primary;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.textTertiary;
    }
  };

  const getVerificationStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'in_progress':
        return 'In Progress';
      case 'rejected':
        return 'Requires Attention';
      default:
        return 'Unknown';
    }
  };

  const getSubscriptionBadgeColor = (name: string) => {
    switch (name) {
      case 'Free':
        return 'rgba(255, 255, 255, 0.05)';
      case 'Premium':
        return 'rgba(255, 107, 0, 0.15)';
      case 'Pro':
        return 'rgba(99, 102, 241, 0.15)';
      case 'Standard':
        return 'rgba(16, 185, 129, 0.15)';
      default:
        return 'rgba(255, 255, 255, 0.05)';
    }
  };

  const renderWorkspaceCard = (plan: WorkspacePlan) => {
    const isActive = activeWorkspaces.has(plan.id);
    const isDefault = plan.id === 'house_seeker';
    const statusColor = getVerificationStatusColor(plan.verificationStatus);
    const statusText = getVerificationStatusLabel(plan.verificationStatus);
    const badgeColor = getSubscriptionBadgeColor(plan.subscription.name);

    return (
      <LiquidGlass
        key={plan.id}
        variant={isActive ? 'elevated' : 'default'}
        style={styles.workspaceCard}
        noPadding
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (isActive) {
              // Navigate to workspace management
              navigation.navigate('WorkspaceManagement', { workspaceId: plan.id });
            } else {
              handleActivateWorkspace(plan.id);
            }
          }}
          disabled={isUpgrading}
        >
          <View style={styles.cardContent}>
            {/* Icon Section */}
            <View style={[styles.iconContainer, { backgroundColor: `${plan.color}20` }]}>            
              <Ionicons name={plan.icon as any} size={28} color={plan.color} />
              {isActive && (
                <View style={styles.activeIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                </View>
              )}
            </View>

            {/* Title and Status */}
            <View style={styles.titleSection}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{plan.title}</Text>
                {isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
              {plan.description}
            </Text>

            {/* Benefits Preview */}
            <View style={styles.benefitsSection}>
              {plan.benefits.slice(0, 2).map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                  <Text style={styles.benefitText} numberOfLines={1}>
                    {benefit}
                  </Text>
                </View>
              ))}
              {plan.benefits.length > 2 && (
                <Text style={styles.moreBenefitsText}>
                  + {plan.benefits.length - 2} more benefits
                </Text>
              )}
            </View>

            {/* Subscription Badge */}
            <View style={[styles.subscriptionBadge, { backgroundColor: badgeColor }]}>
              <Text style={[styles.subscriptionText, { color: plan.subscription.active ? plan.color : COLORS.text }]}>
                {plan.subscription.active ? 'Active' : plan.subscription.name}
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : plan.color }]}
              onPress={() => {
                if (isActive) {
                  navigation.navigate('WorkspaceManagement', { workspaceId: plan.id });
                } else {
                  handleActivateWorkspace(plan.id);
                }
              }}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : isActive ? (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Manage</Text>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Activate</Text>
                  <Ionicons name="add-circle-outline" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </LiquidGlass>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={['#000000', '#0A0A0F']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Workspace & Plans</Text>
            <Text style={styles.headerSubtitle}>Manage all your HAMA workspaces in one place</Text>
          </View>
          <LiquidGlass variant="subtle" style={styles.headerIcon}>
            <Ionicons name="layers-outline" size={24} color={COLORS.primary} />
          </LiquidGlass>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Active Workspaces Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Active Workspaces</Text>
          <LiquidGlass variant="subtle" style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{activeWorkspaces.size}</Text>
                <Text style={styles.summaryLabel}>Workspaces</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                {activeWorkspaces.has('house_seeker') ? (
                  <Ionicons name="checkmark" size={20} color={COLORS.success} />
                ) : (
                  <Ionicons name="remove" size={20} color={COLORS.textSecondary} />
                )}
                <Text style={styles.summaryLabel}>House Seeker</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                {activeWorkspaces.size > 1 ? (
                  <Ionicons name="checkmark" size={20} color={COLORS.success} />
                ) : (
                  <Ionicons name="remove" size={20} color={COLORS.textSecondary} />
                )}
                <Text style={styles.summaryLabel}>Additional</Text>
              </View>
            </View>
          </LiquidGlass>
        </View>

        {/* Workspace Cards */}
        {isLoading ? (
          <View style={styles.skeletonSection}>
            {[1, 2, 3, 4].map((_, index) => (
              <SkeletonLoader key={index} type="liquid-card" style={styles.skeletonCard} />
            ))}
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {workspacePlans.map(renderWorkspaceCard)}
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoTitle}>Workspace Information</Text>
          </View>
          <Text style={styles.infoText}>
            Workspaces allow you to access different features and services without creating separate accounts. 
            All your data and preferences are synced across workspaces. Activated workspaces will have 
            full access to their respective features and services.
          </Text>
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.bodyLarge,
    color: COLORS.text,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  cardsContainer: {
    gap: SPACING.lg,
  },
  workspaceCard: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  cardContent: {
    padding: SPACING.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.full,
    padding: 2,
  },
  titleSection: {
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    ...FONTS.bodyLarge,
    color: COLORS.text,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  defaultText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  statusText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  description: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  benefitsSection: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  benefitText: {
    ...FONTS.caption,
    color: COLORS.text,
    flex: 1,
  },
  moreBenefitsText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  subscriptionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  subscriptionText: {
    ...FONTS.caption,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  buttonText: {
    ...FONTS.button,
    color: '#fff',
    fontWeight: '600',
  },
  summaryCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    ...FONTS.h2,
    color: COLORS.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.glassBorder,
  },
  skeletonSection: {
    gap: SPACING.lg,
  },
  skeletonCard: {
    height: 180,
    borderRadius: RADIUS.lg,
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    ...FONTS.bodyLarge,
    color: COLORS.text,
    fontWeight: '600',
  },
  infoText: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
