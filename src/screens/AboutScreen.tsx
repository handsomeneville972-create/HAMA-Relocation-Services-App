/**
 * HAMA™ About Screen
 *
 * A premium About page with a YouTube-thumbnail-inspired grid layout.
 * Features 2-column rounded cards, parallax hero, and animated sections.
 *
 * Layout is ready for user content and images — placeholder gradients
 * are used until images are uploaded via the imageUri prop.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  Linking,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { ThumbnailCard, ThumbnailGrid } from '../components/ThumbnailCard';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS, DIMENSIONS } from '../constants/theme';

const { width } = Dimensions.get('window');
const GRID_CARD_WIDTH = (width - SPACING.md * 2 - SPACING.sm) / 2; // 2 columns with gap

// ============================================================
// SECTION DATA — Ready for user content injection
// Each section has: title, items (with title, desc, imageUri, badge)
// When the user uploads content + images, update these arrays.
// ============================================================

/** Our Services / What We Do — displayed as YouTube-style thumbnail grid */
const SERVICES = [
  {
    title: 'Property Discovery',
    description: 'Find verified rental properties that match your budget and lifestyle.',
    icon: 'home-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/service-property-discovery.jpg'),
    badge: 'POPULAR',
    meta: '2,400+ listings',
  },
  {
    title: 'Relocation Support',
    description: 'Full-service moving assistance from the Hamisha Squad.',
    icon: 'car-outline',
    gradient: ['#FFFFFF', 'rgba(255,255,255,0.6)'] as const,
    imageUri: require('../../assets/service-relocation.jpg'),
    badge: 'NEW',
    meta: '1,200+ moves completed',
  },
  {
    title: 'Marketplace',
    description: 'Furniture, appliances, and home essentials at great prices.',
    icon: 'cart-outline',
    gradient: ['#00D4AA', '#00D4AA'] as const,
    imageUri: require('../../assets/service-movers.jpg'),
    badge: 'BETA',
    meta: '3,800+ products',
  },
  {
    title: 'Student Housing',
    description: 'Affordable rentals near universities and colleges.',
    icon: 'school-outline',
    gradient: ['#FFB84D', '#FFB366'] as const,
    imageUri: require('../../assets/service-student-housing.jpg'),
    badge: 'TRENDING',
    meta: '600+ student listings',
  },
  {
    title: 'Neighborhood Intel',
    description: 'Understand communities before you move — schools, hospitals, transit.',
    icon: 'globe-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/service-landlord-showing.jpg'),
    badge: '',
    meta: '30+ neighborhoods',
  },
  {
    title: 'AI Recommendations',
    description: 'Personalized housing suggestions powered by machine learning.',
    icon: 'sparkles-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/service-family-moving.jpg'),
    badge: 'PREMIUM',
    meta: 'Coming soon',
  },
];

/** What We Do / Discover Your Next Home — image section */
const DISCOVER = [
  {
    title: 'Family Viewing',
    description: 'Explore potential homes together with your loved ones and find the perfect space for your family.',
    icon: 'people-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/discover-family-viewing.jpg'),
  },
  {
    title: 'Digital Search',
    description: 'Browse thousands of listings from the comfort of your phone — anytime, anywhere.',
    icon: 'phone-portrait-outline',
    gradient: ['#FFFFFF', 'rgba(255,255,255,0.6)'] as const,
    imageUri: require('../../assets/discover-couple-mobile.jpg'),
  },
  {
    title: 'Apartment Hunting',
    description: 'Find your dream apartment with smart filters, virtual tours, and real-time availability.',
    icon: 'business-outline',
    gradient: ['#00D4AA', '#00D4AA'] as const,
    imageUri: require('../../assets/discover-woman-apartment.jpg'),
  },
  {
    title: 'First Home',
    description: 'Take the exciting step toward homeownership with guidance every step of the way.',
    icon: 'home-outline',
    gradient: ['#FFB84D', '#FFB366'] as const,
    imageUri: require('../../assets/discover-family-buying.jpg'),
  },
  {
    title: 'Flat Hunting',
    description: 'Discover cozy flats in the best neighborhoods tailored to your budget and lifestyle.',
    icon: 'layers-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/discover-looking-flat.jpg'),
  },
  {
    title: 'On-the-Go Search',
    description: 'Search, save, and connect with landlords from anywhere using the HAMA app.',
    icon: 'map-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/discover-woman-smartphone.jpg'),
  },
];

/** Helping Students Start Their Journey — image section */
const STUDENTS = [
  {
    title: 'Student Move-In',
    description: 'Join a community of students moving into their new home away from home.',
    icon: 'people-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/students-moving-in.jpg'),
  },
  {
    title: 'Dorm Room Setup',
    description: 'Get tips and essentials for setting up your perfect student room.',
    icon: 'bed-outline',
    gradient: ['#FFFFFF', 'rgba(255,255,255,0.6)'] as const,
    imageUri: require('../../assets/students-dorm-room.jpg'),
  },
  {
    title: 'Moving Belongings',
    description: 'Stress-free moving with student-friendly relocation services.',
    icon: 'cube-outline',
    gradient: ['#00D4AA', '#00D4AA'] as const,
    imageUri: require('../../assets/students-bring-things.jpg'),
  },
  {
    title: 'Renting Guide',
    description: 'Learn everything you need to know about renting as a student.',
    icon: 'book-outline',
    gradient: ['#FFB84D', '#FFB366'] as const,
    imageUri: require('../../assets/students-renting-guide.jpg'),
  },
  {
    title: 'Campus Move-In',
    description: 'Make your campus transition smooth with our student housing experts.',
    icon: 'school-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/students-unpacking.jpg'),
  },
  {
    title: 'Friends Together',
    description: 'Find roommates and build your community in your new city.',
    icon: 'happy-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/students-accommodation-friends.jpg'),
  },
];

/** Understanding Neighbourhoods Before You Move — image section */
const NEIGHBOURHOODS = [
  {
    title: 'Parks & Recreation',
    description: 'Explore green spaces like Anderson Park — perfect for relaxation, jogging, and family outings in your neighborhood.',
    icon: 'leaf-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/neighbourhood-park.jpg'),
  },
  {
    title: 'Top Schools Nearby',
    description: 'Find quality education options including Hospital Hill Primary School and other top-rated institutions in the area.',
    icon: 'school-outline',
    gradient: ['#FFFFFF', 'rgba(255,255,255,0.6)'] as const,
    imageUri: require('../../assets/neighbourhood-school.jpg'),
  },
  {
    title: 'Healthcare Access',
    description: 'Know your nearby hospitals and clinics like Mother & Child Hospital for peace of mind and emergency care.',
    icon: 'medkit-outline',
    gradient: ['#00D4AA', '#00D4AA'] as const,
    imageUri: require('../../assets/neighbourhood-hospital.jpg'),
  },
  {
    title: 'Community Spaces',
    description: 'Discover modern housing estates with playgrounds, benches, and shared spaces that bring neighbors together.',
    icon: 'people-outline',
    gradient: ['#FFB84D', '#FFB366'] as const,
    imageUri: require('../../assets/neighbourhood-community-space.jpg'),
  },
  {
    title: 'Shopping & Commerce',
    description: 'Explore local malls and businesses — from BBS Mall in Eastleigh to neighborhood markets that shape property value.',
    icon: 'storefront-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/neighbourhood-mall.jpg'),
  },
  {
    title: 'Family-Friendly Streets',
    description: 'Walk safe, tree-lined streets where families enjoy quality time together — the hallmark of a great neighborhood.',
    icon: 'walk-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/neighbourhood-family-walk.jpg'),
  },
];

/** Platform Highlights / Features — secondary grid */
const HIGHLIGHTS = [
  {
    title: 'Verified Listings',
    description: 'Every property is reviewed for accuracy and quality.',
    icon: 'shield-checkmark-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
  },
  {
    title: 'No Commission',
    description: 'Direct connections between tenants and landlords.',
    icon: 'cash-outline',
    gradient: ['#00D4AA', '#00D4AA'] as const,
  },
  {
    title: 'Smart Matching',
    description: 'AI-powered recommendations tailored to your needs.',
    icon: 'bulb-outline',
    gradient: ['#FFB84D', '#FFB366'] as const,
  },
  {
    title: '24/7 Support',
    description: 'We are here to help at every step of your journey.',
    icon: 'headset-outline',
    gradient: ['#FFFFFF', 'rgba(255,255,255,0.6)'] as const,
  },
];


/** Join the HAMA Community — real moments from our community */
const COMMUNITY = [
  {
    title: 'Friends Helping Friends',
    description: 'Our community comes together to help each other move in and settle down.',
    icon: 'people-outline',
    gradient: ['#FF6B00', '#FF8A33'] as const,
    imageUri: require('../../assets/community-friends-helping.jpg'),
  },
  {
    title: 'Your New Home Awaits',
    description: 'Getting those keys is the start of an exciting new chapter in your life.',
    icon: 'key-outline',
    gradient: ['#FFFFFF', 'rgba(255,255,255,0.6)'] as const,
    imageUri: require('../../assets/community-house-key.jpg'),
  },
  {
    title: 'Roommates & Friends',
    description: 'Sharing a home with friends makes every day brighter and the journey unforgettable.',
    icon: 'happy-outline',
    gradient: ['#00D4AA', '#00D4AA'] as const,
    imageUri: require('../../assets/community-friends-happy.jpg'),
  },
];

/** Values — shown in a compact grid */
const VALUES = [
  { icon: 'shield-checkmark', title: 'Trust', desc: 'We prioritize transparency and verified information.' },
  { icon: 'people', title: 'Community', desc: 'We help people build better lives through better housing decisions.' },
  { icon: 'flash-outline', title: 'Simplicity', desc: 'We make housing search and relocation easy.' },
  { icon: 'bulb-outline', title: 'Innovation', desc: 'We use technology to solve real-world challenges.' },
  { icon: 'globe-outline', title: 'Accessibility', desc: 'Everyone deserves access to quality housing information.' },
];



// ============================================================
// ANIMATED SECTION — staggered fade-in + slide-up
// ============================================================

const AnimatedSection: React.FC<{ children: React.ReactNode; index: number }> = ({ children, index }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 120,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
};

// ============================================================
// SECTION HEADER
// ============================================================

const SectionHeader: React.FC<{ title: string; subtitle?: string; center?: boolean }> = ({ title, subtitle, center }) => (
  <View style={[sectionHeaderStyles.container, center && sectionHeaderStyles.center]}>
    <Text style={sectionHeaderStyles.title}>{title}</Text>
    {subtitle && <Text style={sectionHeaderStyles.subtitle}>{subtitle}</Text>}
  </View>
);

const sectionHeaderStyles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  center: {
    alignItems: 'center',
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
  },
  subtitle: {
    ...FONTS.bodySmall,
    color: COLORS.textTertiary,
    marginTop: 4,
    lineHeight: 20,
  },
});

// ============================================================
// SCREEN
// ============================================================

export const AboutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Parallax transforms
  const heroTranslateY = scrollY.interpolate({ inputRange: [0, 300], outputRange: [0, -80], extrapolate: 'clamp' });
  const heroScale = scrollY.interpolate({ inputRange: [-50, 0, 200], outputRange: [1.05, 1, 0.95], extrapolate: 'clamp' });
  const heroOpacity = scrollY.interpolate({ inputRange: [0, 100, 300], outputRange: [1, 1, 0.6], extrapolate: 'clamp' });
  const brandScale = scrollY.interpolate({ inputRange: [0, 200], outputRange: [1, 0.85], extrapolate: 'clamp' });
  const brandTranslateY = scrollY.interpolate({ inputRange: [0, 300], outputRange: [0, -40], extrapolate: 'clamp' });
  const titleTranslateY = scrollY.interpolate({ inputRange: [0, 300], outputRange: [0, -25], extrapolate: 'clamp' });
  const subtitleTranslateY = scrollY.interpolate({ inputRange: [0, 300], outputRange: [0, -15], extrapolate: 'clamp' });

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ===== PARALLAX HERO ===== */}
        <Animated.View style={[styles.heroSection, { opacity: heroOpacity, transform: [{ translateY: heroTranslateY }, { scale: heroScale }] }]}>
          <LinearGradient colors={['#000000', '#0A0A0A', '#000000']} style={styles.heroGradient}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={[styles.heroContent, { paddingTop: insets.top + SPACING.xl }]}>
              <Animated.View style={{ transform: [{ translateY: brandTranslateY }, { scale: brandScale }] }}>
                <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.brandIcon}>
                  <Text style={styles.brandIconText}>H</Text>
                </LinearGradient>
              </Animated.View>
              <Animated.View style={{ transform: [{ translateY: titleTranslateY }] }}>
                <Text style={styles.heroTitle}>Welcome to HAMA™</Text>
              </Animated.View>
              <Animated.View style={{ transform: [{ translateY: subtitleTranslateY }] }}>
                <Text style={styles.heroSubtitle}>Need a house homie? We've got you!</Text>
              </Animated.View>
              <Text style={styles.heroDescription}>
                HAMA™ is more than a housing platform — we are your trusted companion throughout your housing journey. Whether you are searching for your first home, relocating for work, moving closer to campus, or helping your family find a better place to live, HAMA is designed to make the process simpler, smarter, and stress-free.
              </Text>
              <Text style={styles.heroTagline}>
                We believe that finding a home should not be complicated, expensive, or uncertain. That is why we combine technology, local insights, and relocation support to help people discover homes and move with confidence.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ===== SECTION: WHAT WE DO / DISCOVER YOUR NEXT HOME ===== */}
        <AnimatedSection index={0}>
          <View style={styles.section}>
            <SectionHeader title="What We Do" subtitle="Discover your next home with HAMA" />
            <ThumbnailGrid>
              {DISCOVER.map((item, i) => (
                <ThumbnailCard
                  key={i}
                  title={item.title}
                  description={item.description}
                  imageUri={item.imageUri}
                  placeholderGradient={item.gradient}
                  placeholderIcon={item.icon}
                  width={GRID_CARD_WIDTH}
                />
              ))}
            </ThumbnailGrid>
          </View>
        </AnimatedSection>

        {/* ===== SECTION: HELPING STUDENTS START THEIR JOURNEY ===== */}
        <AnimatedSection index={1}>
          <View style={styles.section}>
            <SectionHeader title="Helping Students" subtitle="Start your journey with student-friendly housing" />
            <ThumbnailGrid>
              {STUDENTS.map((item, i) => (
                <ThumbnailCard
                  key={i}
                  title={item.title}
                  description={item.description}
                  imageUri={item.imageUri}
                  placeholderGradient={item.gradient}
                  placeholderIcon={item.icon}
                  width={GRID_CARD_WIDTH}
                />
              ))}
            </ThumbnailGrid>
          </View>
        </AnimatedSection>

        {/* ===== SECTION: UNDERSTANDING NEIGHBOURHOODS ===== */}
        <AnimatedSection index={2}>
          <View style={styles.section}>
            <SectionHeader title="Understanding Neighbourhoods" subtitle="Before you move — know what matters" />
            <ThumbnailGrid>
              {NEIGHBOURHOODS.map((item, i) => (
                <ThumbnailCard
                  key={i}
                  title={item.title}
                  description={item.description}
                  imageUri={item.imageUri}
                  placeholderGradient={item.gradient}
                  placeholderIcon={item.icon}
                  width={GRID_CARD_WIDTH}
                />
              ))}
            </ThumbnailGrid>
          </View>
        </AnimatedSection>

        {/* ===== SECTION: OUR SERVICES (YouTube-thumbnail grid) ===== */}
        <AnimatedSection index={3}>
          <View style={styles.section}>
            <SectionHeader title="Our Services" subtitle="Everything you need for a smooth housing journey" />
            <ThumbnailGrid>
              {SERVICES.map((service, i) => (
                <ThumbnailCard
                  key={i}
                  title={service.title}
                  description={service.description}
                  imageUri={service.imageUri}
                  placeholderGradient={service.gradient}
                  placeholderIcon={service.icon}
                  badge={service.badge}
                  meta={service.meta}
                  width={GRID_CARD_WIDTH}
                  onPress={() => {}}
                />
              ))}
            </ThumbnailGrid>
          </View>
        </AnimatedSection>

        {/* ===== SECTION: WHO WE ARE ===== */}
        <AnimatedSection index={4}>
          <View style={styles.section}>
            <GlassCard>
              <View style={styles.whoWeAreContent}>
                <View style={styles.whoWeAreIconRow}>
                  <View style={[styles.whoWeAreIcon, { backgroundColor: 'rgba(255,107,0,0.15)' }]}>
                    <Ionicons name="information-circle" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.whoWeAreTitle}>Who We Are</Text>
                </View>
                <Text style={styles.whoWeAreText}>
                  We are a passionate team of technologists, housing experts, and community builders dedicated to transforming how people find homes in Africa. Our platform connects house seekers with verified properties, trusted service providers, and essential relocation support — all in one place.
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>10,000+</Text>
                    <Text style={styles.statLabel}>Users</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>3,000+</Text>
                    <Text style={styles.statLabel}>Properties</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>500+</Text>
                    <Text style={styles.statLabel}>Providers</Text>
                  </View>
                </View>
                <Text style={styles.whoWeAreCta}>
                  When you use HAMA, you are not just finding a house — you are finding a home.
                </Text>
              </View>
            </GlassCard>
          </View>
        </AnimatedSection>

        {/* ===== SECTION: PLATFORM HIGHLIGHTS (2-column grid) ===== */}
        <AnimatedSection index={5}>
          <View style={styles.section}>
            <SectionHeader title="Platform Highlights" />
            <ThumbnailGrid>
              {HIGHLIGHTS.map((item, i) => (
                <ThumbnailCard
                  key={i}
                  title={item.title}
                  description={item.description}
                  placeholderGradient={item.gradient}
                  placeholderIcon={item.icon}
                  width={GRID_CARD_WIDTH}
                />
              ))}
            </ThumbnailGrid>
          </View>
        </AnimatedSection>

        {/* ===== SECTION: MISSION & VISION ===== */}
        <AnimatedSection index={6}>
          <View style={styles.section}>
            <View style={styles.missionRow}>
              <GlassCard style={styles.missionCard}>
                <View style={styles.missionContent}>
                  <View style={styles.missionIcon}>
                    <Ionicons name="flag" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.missionTitle}>Our Mission</Text>
                  <Text style={styles.missionText}>
                    To simplify housing discovery and relocation by helping people find homes, understand communities, and move confidently.
                  </Text>
                </View>
              </GlassCard>
              <GlassCard style={styles.missionCard}>
                <View style={styles.missionContent}>
                  <View style={[styles.missionIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Ionicons name="eye" size={24} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.missionTitle}>Our Vision</Text>
                  <Text style={styles.missionText}>
                    To become Africa's most trusted housing and relocation platform.
                  </Text>
                </View>
              </GlassCard>
            </View>
          </View>
        </AnimatedSection>

        {/* ===== SECTION: OUR VALUES (compact grid) ===== */}
        <AnimatedSection index={7}>
          <View style={styles.section}>
            <SectionHeader title="Our Values" center />
            <View style={styles.valuesGrid}>
              {VALUES.map((value, i) => (
                <GlassCard key={i}>
                  <View style={styles.valueCardInner}>
                    <View style={styles.valueIconContainer}>
                      <Ionicons name={value.icon as any} size={22} color={COLORS.primary} />
                    </View>
                    <View style={styles.valueTextContainer}>
                      <Text style={styles.valueTitle}>{value.title}</Text>
                      <Text style={styles.valueDesc}>{value.desc}</Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>
        </AnimatedSection>

        {/* ===== SECTION: JOIN THE COMMUNITY ===== */}
        <AnimatedSection index={9}>
          <View style={styles.section}>
            <SectionHeader title="Join the HAMA Community" subtitle="Real moments from our community — find your people, find your home" />
            <ThumbnailGrid>
              {COMMUNITY.map((item, i) => (
                <ThumbnailCard
                  key={i}
                  title={item.title}
                  description={item.description}
                  imageUri={item.imageUri}
                  placeholderGradient={item.gradient}
                  placeholderIcon={item.icon}
                  width={GRID_CARD_WIDTH}
                />
              ))}
            </ThumbnailGrid>
            <GlassCard>
              <View style={styles.communityContent}>
                <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.communityIcon}>
                  <Ionicons name="people" size={36} color="#fff" />
                </LinearGradient>
                <Text style={styles.communityDesc}>
                  Whether you are searching for your first rental, relocating for work, moving closer to school, or planning your next chapter, HAMA is here to help every step of the way.
                </Text>
                <TouchableOpacity style={styles.joinButton}>
                  <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.joinButtonGradient}>
                    <Ionicons name="people" size={20} color="#fff" />
                    <Text style={styles.joinButtonText}>Join the Community</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </AnimatedSection>

        {/* ===== FOOTER ===== */}
        <View style={styles.footerContainer}>
          <Image source={require('../../assets/footer-bg.png')} style={styles.footerBg} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.82)', 'rgba(0,0,0,0.90)']}
            style={styles.footerOverlay}
          />

          <View style={styles.footerContent}>
            <View style={styles.footerColumns}>
              {/* Logo + Description + Socials */}
              <View style={styles.footerBrand}>
                <Image source={require('../../assets/hama-logo.png')} style={styles.footerLogo} resizeMode="contain" />
                <Text style={styles.footerBrandName}>HAMA™</Text>
                <Text style={styles.footerDescription}>
                  Your all-in-one platform for finding rental homes, easy relocation, and home essentials—making every move simple.
                </Text>
                <View style={styles.footerSocials}>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.facebook.com/hamanasi2026')} activeOpacity={0.7}>
                    <Ionicons name="logo-facebook" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.instagram.com/hamanasi2026/')} activeOpacity={0.7}>
                    <Ionicons name="logo-instagram" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://x.com/hamanasi2026')} activeOpacity={0.7}>
                    <Ionicons name="logo-twitter" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.tiktok.com/@hama_nasi_2026')} activeOpacity={0.7}>
                    <Ionicons name="logo-tiktok" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://www.youtube.com/channel/UCR6Px4BchUW3z143ntOLx7w')} activeOpacity={0.7}>
                    <Ionicons name="logo-youtube" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.footerSocialBtn} onPress={() => Linking.openURL('https://linkedin.com/company/hama')} activeOpacity={0.7}>
                    <Ionicons name="logo-linkedin" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Company Column */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Company</Text>
                <TouchableOpacity onPress={() => navigation.navigate('About')}><Text style={styles.footerLink}>About Us</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/careers')}><Text style={styles.footerLink}>Careers</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/blog')}><Text style={styles.footerLink}>Blog</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/press')}><Text style={styles.footerLink}>Press</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('mailto:support@hama.com')}><Text style={styles.footerLink}>Contact Us</Text></TouchableOpacity>
              </View>

              {/* Support Column */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Support</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}><Text style={styles.footerLink}>Help Center</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/faqs')}><Text style={styles.footerLink}>FAQs</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/safety')}><Text style={styles.footerLink}>Safety Tips</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/terms')}><Text style={styles.footerLink}>Terms of Service</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://hama.com/privacy')}><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
              </View>

              {/* Explore Column */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Explore</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>Rentals</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Services')}><Text style={styles.footerLink}>Relocation</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Marketplace')}><Text style={styles.footerLink}>Marketplace</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Services')}><Text style={styles.footerLink}>Services</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>Short Lets</Text></TouchableOpacity>
              </View>

              {/* Stay Updated */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Stay Updated</Text>
                <Text style={styles.footerStayText}>Subscribe to get the latest homes, deals and tips.</Text>
                <View style={styles.footerEmailRow}>
                  <TextInput
                    style={styles.footerEmailInput}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.footerEmailBtn}>
                    <Ionicons name="send" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Bottom Bar */}
            <View style={styles.footerBottomBar}>
              <Text style={styles.footerCopyright}>© 2026 HAMA. All rights reserved.</Text>
              <Text style={styles.footerTaglineBottom}>
                <Text style={styles.footerTaglineBold}>Built for you.</Text>{' '}
                <Text style={styles.footerTaglineBold}>Built for today.</Text>{' '}
                <Text style={styles.footerTaglineBold}>Built for home.</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 50 }} />
      </Animated.ScrollView>
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // ---- Hero ----
  heroSection: { overflow: 'hidden' },
  heroGradient: { paddingBottom: SPACING.xxl },
  backButton: {
    position: 'absolute', top: 50, left: SPACING.md,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  heroContent: {
    paddingHorizontal: SPACING.md, alignItems: 'center', paddingTop: 100,
  },
  brandIcon: {
    width: 64, height: 64, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.lg, ...SHADOWS.glow,
  },
  brandIconText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  heroTitle: {
    ...FONTS.title, color: COLORS.text, textAlign: 'center', marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    ...FONTS.h3, color: COLORS.primaryLight, textAlign: 'center', marginBottom: SPACING.lg,
  },
  heroDescription: {
    ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.md,
  },
  heroTagline: {
    ...FONTS.bodySmall, color: COLORS.textTertiary, textAlign: 'center', fontStyle: 'italic',
  },
  // ---- Sections ----
  section: {
    paddingHorizontal: SPACING.md, marginBottom: SPACING.md,
  },
  // ---- Who We Are ----
  whoWeAreContent: {
    padding: SPACING.md, gap: SPACING.sm,
  },
  whoWeAreIconRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  whoWeAreIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  whoWeAreTitle: {
    ...FONTS.h2, color: COLORS.text,
  },
  whoWeAreText: {
    ...FONTS.body, color: COLORS.textSecondary, lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    paddingVertical: SPACING.md, marginVertical: SPACING.sm,
  },
  statItem: {
    flex: 1, alignItems: 'center', gap: 2,
  },
  statValue: {
    ...FONTS.h2, color: COLORS.text,
  },
  statLabel: {
    color: COLORS.textTertiary, fontSize: 11,
  },
  statDivider: {
    width: 1, height: 30, backgroundColor: COLORS.glassBorder,
  },
  whoWeAreCta: {
    ...FONTS.bodySmall, color: COLORS.primaryLight, textAlign: 'center', fontStyle: 'italic',
  },
  // ---- Mission & Vision ----
  missionRow: {
    flexDirection: 'row', gap: 10,
  },
  missionCard: {
    flex: 1,
  },
  missionContent: {
    padding: SPACING.md,
  },
  missionIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm,
  },
  missionTitle: {
    ...FONTS.h3, color: COLORS.text, marginBottom: SPACING.xs,
  },
  missionText: {
    ...FONTS.bodySmall, color: COLORS.textSecondary, lineHeight: 20,
  },
  // ---- Values ----
  valuesGrid: {
    gap: 10,
  },
  valueCardInner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: SPACING.sm,
  },
  valueIconContainer: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  valueTextContainer: {
    flex: 1, gap: 4,
  },
  valueTitle: {
    ...FONTS.h3, color: COLORS.text,
  },
  valueDesc: {
    ...FONTS.bodySmall, color: COLORS.textSecondary, lineHeight: 20,
  },
  // ---- Community ----
  communityContent: {
    padding: SPACING.lg, alignItems: 'center', gap: 12,
  },
  communityIcon: {
    width: 64, height: 64, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.glow,
  },
  communityDesc: {
    ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22,
  },
  joinButton: {
    width: '100%', borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm,
  },
  joinButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  joinButtonText: {
    color: '#fff', fontSize: 16, fontWeight: '700',
  },
  // ---- Footer ----
  footerContainer: {
    position: 'relative',
    overflow: 'hidden',
    marginTop: SPACING.lg,
  },
  footerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  footerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerContent: {
    position: 'relative',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl + SPACING.md,
    paddingBottom: SPACING.lg,
  },
  footerColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  footerBrand: {
    width: 200,
    gap: 6,
  },
  footerLogo: {
    width: 40,
    height: 40,
  },
  footerBrandName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  footerDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  footerSocials: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  footerSocialBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerColumn: {
    gap: 8,
    minWidth: 100,
  },
  footerColumnTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  footerLink: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 22,
  },
  footerStayText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  footerEmailRow: {
    flexDirection: 'row',
    gap: 0,
    marginTop: 4,
  },
  footerEmailInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
  },
  footerEmailBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -1,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  footerBottomBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerCopyright: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  footerTaglineBottom: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  footerTaglineBold: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
