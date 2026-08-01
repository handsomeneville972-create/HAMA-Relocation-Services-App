import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { GlassCard } from '../components/GlassCard';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useProvider } from '../contexts/ProviderContext';
import { MOCK_SERVICE_PROVIDERS } from '../constants/data';
import {
  ProviderDayHours,
  ProviderPackage,
  ProviderProfile,
  ProviderReview,
  ServiceProvider,
} from '../constants/types';
import { formatPrice } from '../utils/currency';

interface Props {
  providerId?: string;
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PORTFOLIO_URLS = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600',
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600',
  'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
];

const SIMILAR_IDS = ['sp1', 'sp3', 'sp8', 'sp10'];

function enrichMock(sp: ServiceProvider): ProviderProfile {
  const sub = sp.subcategory;
  const isPlumber = sub === 'Plumbers';
  const isCleaner = sub === 'House Cleaners' || sub === 'Deep Cleaning';
  const isElectric = sub === 'Electricians';
  const services: ProviderProfile['services'] = [
    {
      id: `${sp.id}-s1`,
      name: isPlumber ? 'Full plumbing inspection' : isCleaner ? 'Standard home cleaning' : isElectric ? 'Electrical inspection' : `${sub} — standard job`,
      description: isPlumber
        ? 'Complete leak detection, pipe repair and fixture check across the home.'
        : isCleaner
          ? 'Full deep clean of living areas, kitchen and bathrooms with eco products.'
          : isElectric
            ? 'Certified inspection of wiring, switches, and safety compliance.'
            : 'Professional service delivered by a vetted, experienced specialist.',
      price: isCleaner ? 3000 : isPlumber ? 1500 : isElectric ? 1800 : 2500,
      priceUnit: 'per hour',
      duration: '2-3 hours',
      warranty: '3 months on repairs',
      emergencyAvailable: isPlumber || isElectric,
      active: true,
    },
    {
      id: `${sp.id}-s2`,
      name: isCleaner ? 'Move-out deep clean' : isPlumber ? 'Water heater service' : isElectric ? 'Lighting installation' : 'Premium package job',
      description: 'Premium treatment for a spotless result — popular with landlords and new tenants.',
      price: isCleaner ? 7500 : 4500,
      priceUnit: 'per job',
      duration: '4-6 hours',
      warranty: '1 month',
      emergencyAvailable: false,
      active: true,
    },
  ];
  const packages: ProviderPackage[] = [
    { id: `${sp.id}-p1`, name: 'Bronze Package', price: 3000, description: 'Essential service with standard turnaround.', features: ['1 service call', 'Standard materials', '48h response'] },
    { id: `${sp.id}-p2`, name: 'Silver Package', price: 6000, description: 'Priority scheduling with warranty included.', features: ['2 service calls', 'Priority booking', '3-month warranty', 'Progress photos'] },
    { id: `${sp.id}-p3`, name: 'Gold Package', price: 12000, description: 'VIP treatment with dedicated contact and extended warranty.', features: ['Unlimited calls (30 days)', 'Same-day scheduling', '6-month warranty', 'Dedicated line'] },
  ];
  const reviews: ProviderReview[] = [
    {
      id: `${sp.id}-r1`,
      customerName: 'Brian Otieno',
      avatar: 'https://i.pravatar.cc/100?u=brian',
      rating: 5,
      text: 'Arrived on time, very professional and tidy. Finished ahead of schedule and even cleaned up after themselves. Will definitely rebook.',
      date: '2 days ago',
      service: services[0].name,
      media: [PORTFOLIO_URLS[0]],
      reply: { text: 'Thank you Brian! Looking forward to working with you again.', date: '1 day ago' },
    },
    {
      id: `${sp.id}-r2`,
      customerName: 'Faith Wanjiru',
      avatar: 'https://i.pravatar.cc/100?u=faitw',
      rating: 4,
      text: 'Fair pricing and clear communication from quote to completion. Only dropped a star because of a small delay on the day.',
      date: '1 week ago',
      service: packages[1].name,
    },
    {
      id: `${sp.id}-r3`,
      customerName: 'Kevin Mwangi',
      avatar: 'https://i.pravatar.cc/100?u=kevink',
      rating: 5,
      text: 'Best service I have used on HAMA. The warranty gave me peace of mind and the follow-up call sealed it.',
      date: '2 weeks ago',
      service: services[1].name,
      media: [PORTFOLIO_URLS[2]],
    },
  ];
  return {
    id: sp.id,
    businessName: sp.name,
    logo: sp.logo,
    coverImage: sp.banner,
    description: sp.description,
    yearsInBusiness: 8,
    teamSize: 12,
    phone: sp.phone,
    email: sp.email,
    website: '',
    socialMedia: [{ platform: 'Instagram', handle: '@' + sp.name.replace(/\s/g, '').toLowerCase() }],
    address: 'Ngong Road, Nairobi',
    county: 'Nairobi',
    town: sp.location,
    gps: { lat: -1.2921, lng: 36.8219 },
    category: sp.category,
    subcategory: sp.subcategory,
    services,
    serviceAreas: { counties: ['Nairobi', 'Kiambu'], towns: ['Westlands', 'Kilimani', 'Kasarani', sp.location], neighborhoods: ['Garden City', 'Imara Daima'], radiusKm: 25 },
    businessHours: (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map((day): ProviderDayHours => ({
      day,
      open: '07:00',
      close: '19:00',
      closed: day === 'Sun',
    })),
    open247: isPlumber || sp.subcategory === 'Security Guards',
    callOutFee: 500,
    consultationFee: 0,
    packages,
    portfolio: PORTFOLIO_URLS.map((uri, i) => ({
      id: `${sp.id}-pf-${i}`,
      type: 'photo',
      uri,
      title: i % 2 === 0 ? 'Completed living room project' : 'Bathroom renovation finish',
      description: 'Delivered with warranty and after-care visit.',
    })),
    certifications: [
      { id: `${sp.id}-c1`, name: 'NITA Trade License', issuer: 'National Industrial Training Authority', year: 2021, verified: true },
      { id: `${sp.id}-c2`, name: 'County Business Permit', issuer: 'Nairobi City County', year: 2024, verified: true },
    ],
    documents: [
      { id: `${sp.id}-d1`, name: 'License.pdf', uri: '', status: 'verified' },
      { id: `${sp.id}-d2`, name: 'Insurance.pdf', uri: '', status: 'verified' },
    ],
    paymentMethods: ['M-Pesa', 'Cash', 'Bank Transfer', 'Card'],
    mpesaNumber: sp.phone,
    bankAccount: null,
    branding: { accentColor: '#FF6A00', tagline: 'Fast, reliable, guaranteed.', promoVideo: null },
    languages: ['English', 'Swahili'],
    isEmergencyProvider: services.some((s) => s.emergencyAvailable),
    warranty: 'All work covered by up to 6 months warranty.',
    team: [
      { id: `${sp.id}-t1`, name: sp.name.replace(/(Movers|Plumbers|Electricians|Cleaners|Packers|Contractors).*$/, ''), role: 'Founder & Lead', avatar: sp.logo },
      { id: `${sp.id}-t2`, name: 'Samuel Njoroge', role: 'Senior Technician', avatar: 'https://i.pravatar.cc/100?u=sam' },
      { id: `${sp.id}-t3`, name: 'Mary Akinyi', role: 'Operations', avatar: 'https://i.pravatar.cc/100?u=mary' },
    ],
    reviews,
    faqs: [
      { id: `${sp.id}-f1`, question: 'Do you offer emergency services?', answer: isPlumber || isElectric ? 'Yes — we are available 24/7 for emergencies with a response time under 30 minutes.' : 'Yes, priority emergency slots are available within business hours.' },
      { id: `${sp.id}-f2`, question: 'What areas do you cover?', answer: 'We currently serve Nairobi, Kiambu and surrounding areas within a 25km radius.' },
      { id: `${sp.id}-f3`, question: 'Do you provide a warranty?', answer: 'Yes. Every job includes up to 3 months warranty on workmanship — Gold packages extend this to 6 months.' },
    ],
    promotions: [
      { id: `${sp.id}-promo1`, title: 'New customer 10% off first booking', discount: '10% OFF', active: true },
      { id: `${sp.id}-promo2`, title: 'Refer a neighbour, both get KSh 500', discount: 'KSh 500', active: true },
    ],
    status: 'active',
    plan: 'Premium',
    subscriptionExpiry: '2026-12-31T00:00:00Z',
    completedSteps: ['identity', 'category', 'services', 'areas', 'hours', 'pricing', 'portfolio', 'certifications', 'payment', 'branding'],
    keywords: [sp.subcategory, sp.category, sp.location].filter(Boolean),
    searchScore: 92,
    onboardingComplete: true,
    responseTime: sp.responseTime,
    rating: sp.rating,
    reviewCount: sp.reviewCount,
    completedJobs: 340,
    totalRevenue: 2450000,
    walletBalance: 86000,
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
  };
}

export const ServiceProviderProfileScreen: React.FC<Props> = ({ providerId, navigation }) => {
  const insets = useSafeAreaInsets();
  const { provider: ownProfile } = useProvider();

  const profile = useMemo<ProviderProfile>(() => {
    if (ownProfile && ownProfile.onboardingComplete && !providerId) return ownProfile;
    const mock = MOCK_SERVICE_PROVIDERS.find((s) => s.id === (providerId || 'sp1')) || MOCK_SERVICE_PROVIDERS[0];
    return enrichMock(mock);
  }, [ownProfile, providerId]);

  const [quoteOpen, setQuoteOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quoteService, setQuoteService] = useState(profile.services[0]?.name || '');
  const [quoteQty, setQuoteQty] = useState('1');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteSent, setQuoteSent] = useState(false);
  const [bookService, setBookService] = useState(profile.services[0]?.name || '');
  const [bookDay, setBookDay] = useState(0);
  const [bookSlot, setBookSlot] = useState<number | null>(null);
  const [bookSent, setBookSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [viewAllReviews, setViewAllReviews] = useState(false);
  const [quoteMode, setQuoteMode] = useState<'estimate' | 'request'>('estimate');

  const similar = useMemo(() => {
    const others = SIMILAR_IDS.filter((id) => id !== profile.id).slice(0, 3);
    return others.map((id) => enrichMock(MOCK_SERVICE_PROVIDERS.find((s) => s.id === id) || MOCK_SERVICE_PROVIDERS[0]));
  }, [profile.id]);

  const estimate = useMemo(() => {
    const svc = profile.services.find((s) => s.name === quoteService) || profile.services[0];
    if (!svc) return 0;
    const qty = Math.max(1, parseInt(quoteQty, 10) || 1);
    return svc.price * qty + profile.callOutFee;
  }, [profile, quoteService, quoteQty]);

  const dayOptions = useMemo(() => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const out: { label: string; date: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      out.push({ label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : names[d.getDay()], date: d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) });
    }
    return out;
  }, []);

  const slots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

  const handleCall = () => Linking.openURL(`tel:${profile.phone.replace(/\s/g, '')}`);
  const handleWhatsApp = () => Linking.openURL(`https://wa.me/${profile.phone.replace(/\s/g, '').replace('+', '')}?text=${encodeURIComponent(`Hi ${profile.businessName}, I found you on HAMA and would like to enquire about your services.`)}`);
  const handleChat = () => navigation.navigate('Inbox');
  const handleShare = async () => {
    await Clipboard.setStringAsync(`https://hama.co.ke/provider/${profile.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendQuote = () => {
    setQuoteSent(true);
    setTimeout(() => {
      setQuoteOpen(false);
      setQuoteSent(false);
      setQuoteMode('estimate');
    }, 1400);
  };

  const sendBooking = () => {
    setBookSent(true);
    setTimeout(() => {
      setBookOpen(false);
      setBookSent(false);
    }, 1400);
  };

  const ratingBars = useMemo(() => {
    const bars = [5, 4, 3, 2, 1].map((star) => {
      const count = profile.reviews.filter((r) => Math.round(r.rating) === star).length;
      const total = Math.max(profile.reviews.length, 1);
      return { star, pct: (count / total) * 100, count };
    });
    const top = bars.find((b) => b.pct > 0);
    if (top) bars.forEach((b) => (b.pct = top.pct === 0 ? 0 : (b.pct / top.pct) * 100));
    return bars;
  }, [profile.reviews]);

  const stat = (icon: keyof typeof Ionicons.glyphMap, value: string, label: string) => (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={16} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const reviewCard = (r: ProviderReview) => (
    <GlassCard key={r.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: r.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewName}>{r.customerName}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons key={s} name={s <= r.rating ? 'star' : 'star-outline'} size={12} color={COLORS.primary} />
            ))}
            <Text style={styles.reviewDate}>{r.date}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.reviewText}>{r.text}</Text>
      {r.media && r.media.length > 0 && (
        <Image source={{ uri: r.media[0] }} style={styles.reviewMedia} />
      )}
      {r.reply && (
        <View style={styles.replyBox}>
          <Text style={styles.replyLabel}>Seller reply</Text>
          <Text style={styles.replyText}>{r.reply.text}</Text>
          <Text style={styles.replyDate}>{r.reply.date}</Text>
        </View>
      )}
    </GlassCard>
  );

  const visibleReviews = viewAllReviews ? profile.reviews : profile.reviews.slice(0, 2);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={COLORS.gradientNight} style={styles.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
        {/* Cover */}
        <View style={styles.coverWrap}>
          <Image source={{ uri: profile.coverImage }} style={styles.cover} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.coverFade} />
          <View style={[styles.coverHeader, { paddingTop: 4 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundBtn}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <TouchableOpacity onPress={handleShare} style={styles.roundBtn}>
                <Ionicons name={copied ? 'checkmark' : 'share-social-outline'} size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.roundBtn}>
                <Ionicons name="bookmark-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          {/* Logo + identity */}
          <View style={styles.identityWrap}>
            <View style={styles.logoFrame}>
              <Image source={{ uri: profile.logo }} style={styles.logo} />
              {profile.status === 'active' && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#000" />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{profile.businessName}</Text>
                {profile.isEmergencyProvider && (
                  <View style={styles.emergencyBadge}>
                    <Ionicons name="flash" size={12} color={COLORS.warning} />
                    <Text style={styles.emergencyBadgeText}>Emergency</Text>
                  </View>
                )}
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name={s <= Math.round(profile.rating) ? 'star' : 'star-outline'} size={14} color={COLORS.primary} />
                ))}
                <Text style={styles.ratingText}>{profile.rating}</Text>
                <Text style={styles.reviewCount}>({profile.reviewCount} reviews)</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={COLORS.textTertiary} />
                <Text style={styles.metaText}>Responds {profile.responseTime}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Ionicons name="location-outline" size={13} color={COLORS.textTertiary} />
                <Text style={styles.metaText}>{profile.town}, {profile.county}</Text>
              </View>
              <View style={styles.chipRow}>
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{profile.category}</Text>
                </View>
                <View style={styles.categoryChipOutline}>
                  <Text style={styles.categoryChipTextOutline}>{profile.subcategory}</Text>
                </View>
                <View style={styles.categoryChipOutline}>
                  <Ionicons name="diamond" size={11} color={COLORS.primary} />
                  <Text style={styles.categoryChipTextOutline}>{profile.plan}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stat('briefcase-outline', `${profile.yearsInBusiness}`, 'Years')}
          {stat('checkmark-done-outline', `${profile.completedJobs}+`, 'Jobs done')}
          {stat('people-outline', `${profile.teamSize}`, 'Team')}
          {stat('globe-outline', profile.languages.length + '', 'Languages')}
        </View>

        {/* Trust badges */}
        <View style={styles.badgesRow}>
          <View style={styles.trustBadge}><Ionicons name="shield-checkmark" size={13} color={COLORS.success} /><Text style={styles.trustText}>Verified</Text></View>
          <View style={styles.trustBadge}><Ionicons name="ribbon-outline" size={13} color={COLORS.primary} /><Text style={styles.trustText}>Certified</Text></View>
          <View style={styles.trustBadge}><Ionicons name="shield-half-outline" size={13} color={COLORS.success} /><Text style={styles.trustText}>Insured</Text></View>
          <View style={styles.trustBadge}><Ionicons name="document-text-outline" size={13} color={COLORS.primary} /><Text style={styles.trustText}>Licensed</Text></View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About {profile.businessName}</Text>
          <Text style={styles.bodyText}>{profile.description}</Text>
          {profile.branding.tagline ? (
            <Text style={styles.tagline}>"{profile.branding.tagline}"</Text>
          ) : null}
          <View style={styles.contactRow}>
            <TouchableOpacity onPress={handleCall} style={styles.contactChip}>
              <Ionicons name="call-outline" size={14} color={COLORS.primary} />
              <Text style={styles.contactChipText}>{profile.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${profile.email}`)} style={styles.contactChip}>
              <Ionicons name="mail-outline" size={14} color={COLORS.primary} />
              <Text style={styles.contactChipText}>{profile.email}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.warrantyRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
            <Text style={styles.warrantyText}>{profile.warranty}</Text>
          </View>
        </View>

        {/* Promotions */}
        {profile.promotions.some((p) => p.active) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offers</Text>
            {profile.promotions.filter((p) => p.active).map((p) => (
              <LinearGradient key={p.id} colors={['rgba(255,107,0,0.15)', 'rgba(255,107,0,0.04)']} style={styles.promoCard}>
                <View style={styles.promoTag}>
                  <Text style={styles.promoTagText}>{p.discount}</Text>
                </View>
                <Text style={styles.promoTitle}>{p.title}</Text>
                <TouchableOpacity style={styles.promoBtn}><Text style={styles.promoBtnText}>Claim</Text></TouchableOpacity>
              </LinearGradient>
            ))}
          </View>
        )}

        {/* Service areas + map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service areas</Text>
          <View style={styles.chipWrap}>
            {[...profile.serviceAreas.counties, ...profile.serviceAreas.towns, ...profile.serviceAreas.neighborhoods].map((a) => (
              <View key={a} style={styles.areaChip}><Text style={styles.areaChipText}>{a}</Text></View>
            ))}
            <View style={styles.areaChip}><Text style={styles.areaChipText}>{profile.serviceAreas.radiusKm} km radius</Text></View>
          </View>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={22} color={COLORS.textTertiary} />
            <Text style={styles.mapText}>Interactive coverage map</Text>
            <View style={styles.mapGrid}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View key={i} style={styles.mapCell}>
                  {i === 2 || i === 5 || i === 9 ? <Ionicons name="location" size={12} color={COLORS.primary} /> : null}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Business hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business hours</Text>
          <GlassCard style={styles.hoursCard}>
            {profile.open247 ? (
              <View style={styles.hoursRow}><Text style={styles.hoursDay}>Every day</Text><Text style={styles.hoursOpen}>Open 24/7</Text></View>
            ) : (
              profile.businessHours.map((d) => (
                <View key={d.day} style={styles.hoursRow}>
                  <Text style={[styles.hoursDay, d.closed && { color: COLORS.textTertiary }]}>{d.day}</Text>
                  <Text style={[styles.hoursOpen, d.closed && { color: COLORS.textTertiary }]}>{d.closed ? 'Closed' : `${d.open} – ${d.close}`}</Text>
                </View>
              ))
            )}
          </GlassCard>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services & pricing</Text>
          {profile.services.map((s) => (
            <GlassCard key={s.id} style={styles.serviceCard}>
              <View style={{ flex: 1 }}>
                <View style={styles.serviceNameRow}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  {s.emergencyAvailable && (
                    <View style={styles.emergencyBadgeSmall}><Ionicons name="flash" size={10} color={COLORS.warning} /><Text style={styles.emergencyBadgeSmallText}>24/7</Text></View>
                  )}
                </View>
                <Text style={styles.serviceDesc}>{s.description}</Text>
                <View style={styles.serviceMeta}>
                  <Text style={styles.servicePrice}>{formatPrice(s.price)} <Text style={styles.serviceUnit}>/{s.priceUnit.replace('per ', '')}</Text></Text>
                  <View style={styles.serviceMetaRight}>
                    <Ionicons name="time-outline" size={12} color={COLORS.textTertiary} />
                    <Text style={styles.serviceMetaText}>{s.duration || 'Flexible'}</Text>
                    <Ionicons name="shield-checkmark-outline" size={12} color={COLORS.textTertiary} style={{ marginLeft: 8 }} />
                    <Text style={styles.serviceMetaText}>{s.warranty || 'Warranty included'}</Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Packages</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
            {profile.packages.map((pkg, i) => (
              <LinearGradient
                key={pkg.id}
                colors={i === 2 ? ['rgba(255,107,0,0.25)', 'rgba(255,107,0,0.06)'] : ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
                style={[styles.pkgCard, i === 2 && { borderWidth: 1, borderColor: 'rgba(255,107,0,0.5)' }]}
              >
                <View style={styles.pkgHeader}>
                  <Ionicons name={i === 0 ? 'medal-outline' : i === 1 ? 'medal' : 'diamond'} size={16} color={i === 2 ? COLORS.primary : COLORS.textSecondary} />
                  <Text style={styles.pkgName}>{pkg.name}</Text>
                  {i === 2 && <View style={styles.popularTag}><Text style={styles.popularText}>Popular</Text></View>}
                </View>
                <Text style={styles.pkgPrice}>{formatPrice(pkg.price)}</Text>
                <Text style={styles.pkgDesc}>{pkg.description}</Text>
                {pkg.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.pkgBtn} onPress={() => { setBookService(profile.services[0]?.name || ''); setBookOpen(true); }}>
                  <Text style={styles.pkgBtnText}>Choose {pkg.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              </LinearGradient>
            ))}
          </ScrollView>
        </View>

        {/* Portfolio */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <Text style={styles.sectionCount}>{profile.portfolio.length} photos</Text>
          </View>
          <View style={styles.portfolioGrid}>
            {profile.portfolio.map((p) => (
              <TouchableOpacity key={p.id} activeOpacity={0.9}>
                <Image source={{ uri: p.uri }} style={styles.portfolioImage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications & licenses</Text>
          {profile.certifications.map((c) => (
            <GlassCard key={c.id} style={styles.certCard}>
              <View style={styles.certIcon}>
                <Ionicons name={c.verified ? 'shield-checkmark' : 'shield-outline'} size={18} color={c.verified ? COLORS.success : COLORS.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.certName}>{c.name}</Text>
                <Text style={styles.certIssuer}>{c.issuer} · {c.year}</Text>
              </View>
              {c.verified && <View style={styles.certVerified}><Text style={styles.certVerifiedText}>Verified</Text></View>}
            </GlassCard>
          ))}
        </View>

        {/* Team */}
        {profile.team.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The team</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
              {profile.team.map((m) => (
                <View key={m.id} style={styles.teamCard}>
                  <Image source={{ uri: m.avatar }} style={styles.teamAvatar} />
                  <Text style={styles.teamName}>{m.name}</Text>
                  <Text style={styles.teamRole}>{m.role}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Payment methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment & financing</Text>
          <View style={styles.chipWrap}>
            {profile.paymentMethods.map((m) => (
              <View key={m} style={styles.areaChip}><Ionicons name="card-outline" size={12} color={COLORS.textSecondary} /><Text style={styles.areaChipText}>{m}</Text></View>
            ))}
          </View>
          <GlassCard style={styles.financeCard}>
            <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
            <Text style={styles.financeText}>Pay in instalments with HAMA Financing — from as little as 3 monthly payments.</Text>
          </GlassCard>
        </View>

        {/* AI quote calculator */}
        <View style={styles.section}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIcon}><Ionicons name="sparkles" size={16} color="#000" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>AI quote calculator</Text>
              <Text style={styles.aiSub}>Instant estimate based on your inputs</Text>
            </View>
          </View>
          <GlassCard style={styles.quoteCard}>
            <Text style={styles.fieldLabel}>Service</Text>
            <View style={styles.chipWrap}>
              {profile.services.map((s) => (
                <TouchableOpacity key={s.id} onPress={() => setQuoteService(s.name)} style={[styles.areaChip, quoteService === s.name && styles.areaChipActive]}>
                  <Text style={[styles.areaChipText, quoteService === s.name && { color: '#000', fontWeight: '700' }]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Quantity / hours</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuoteQty(String(Math.max(1, (parseInt(quoteQty, 10) || 1) - 1)))}>
                <Ionicons name="remove" size={16} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quoteQty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuoteQty(String((parseInt(quoteQty, 10) || 1) + 1))}>
                <Ionicons name="add" size={16} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>Estimated cost</Text>
              <Text style={styles.estimateValue}>{formatPrice(estimate)}</Text>
            </View>
            <Text style={styles.estimateNote}>Includes call-out fee. Final price confirmed by the provider.</Text>
            <TouchableOpacity style={styles.estimateBtn} onPress={() => setQuoteMode('request')}>
              <Text style={styles.estimateBtnText}>Request exact quotation</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <Text style={styles.sectionCount}>{profile.reviewCount} total</Text>
          </View>
          <GlassCard style={styles.ratingSummary}>
            <View style={{ alignItems: 'center', marginRight: SPACING.lg }}>
              <Text style={styles.bigRating}>{profile.rating}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name={s <= Math.round(profile.rating) ? 'star' : 'star-outline'} size={12} color={COLORS.primary} />
                ))}
              </View>
              <Text style={styles.ratingCount}>{profile.reviewCount} reviews</Text>
            </View>
            <View style={{ flex: 1 }}>
              {ratingBars.map((b) => (
                <View key={b.star} style={styles.barRow}>
                  <Text style={styles.barLabel}>{b.star}</Text>
                  <Ionicons name="star" size={10} color={COLORS.textTertiary} />
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${b.pct}%` }]} />
                  </View>
                  <Text style={styles.barCount}>{b.count}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
          {visibleReviews.map(reviewCard)}
          {profile.reviews.length > 2 && (
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => setViewAllReviews((v) => !v)}>
              <Text style={styles.viewAllText}>{viewAllReviews ? 'Show fewer' : `View all ${profile.reviews.length} reviews`}</Text>
              <Ionicons name={viewAllReviews ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently asked</Text>
          {profile.faqs.map((f) => (
            <GlassCard key={f.id} style={styles.faqCard}>
              <TouchableOpacity style={styles.faqHeader} onPress={() => setOpenFaq(openFaq === f.id ? null : f.id)}>
                <Text style={styles.faqQuestion}>{f.question}</Text>
                <Ionicons name={openFaq === f.id ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textTertiary} />
              </TouchableOpacity>
              {openFaq === f.id && <Text style={styles.faqAnswer}>{f.answer}</Text>}
            </GlassCard>
          ))}
        </View>

        {/* Similar providers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Similar providers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
            {similar.map((p) => (
              <TouchableOpacity key={p.id} style={styles.similarCard} onPress={() => navigation.replace(`ServiceProviderProfile?providerId=${p.id}`)}>
                <Image source={{ uri: p.logo }} style={styles.similarLogo} />
                <Text style={styles.similarName}>{p.businessName}</Text>
                <Text style={styles.similarSub}>{p.subcategory} · {p.town}</Text>
                <View style={styles.starsRow}>
                  <Ionicons name="star" size={11} color={COLORS.primary} />
                  <Text style={styles.similarRating}>{p.rating} ({p.reviewCount})</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <LinearGradient colors={['rgba(0,0,0,0.9)', '#000']} style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.md }]}>
        <View style={styles.bottomIcons}>
          <TouchableOpacity style={styles.bottomIconBtn} onPress={handleCall}>
            <Ionicons name="call" size={20} color={COLORS.primary} />
            <Text style={styles.bottomIconText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIconBtn} onPress={handleChat}>
            <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
            <Text style={styles.bottomIconText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIconBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color={COLORS.success} />
            <Text style={styles.bottomIconText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomPrimary} onPress={() => setQuoteOpen(true)}>
            <Ionicons name="document-text-outline" size={18} color="#000" />
            <Text style={styles.bottomPrimaryText}>Request Quotation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomSecondary} onPress={() => setBookOpen(true)}>
            <Ionicons name="calendar" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quote modal */}
      <Modal visible={quoteOpen} transparent animationType="slide" onRequestClose={() => setQuoteOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.md }]}>
            <View style={styles.sheetHandle} />
            {quoteSent ? (
              <View style={styles.successWrap}>
                <View style={styles.successCircle}><Ionicons name="checkmark" size={32} color="#000" /></View>
                <Text style={styles.successTitle}>Quotation requested</Text>
                <Text style={styles.successText}>{profile.businessName} will reply within {profile.responseTime}.</Text>
              </View>
            ) : quoteMode === 'estimate' ? (
              <>
                <Text style={styles.sheetTitle}>AI quote calculator</Text>
                <Text style={styles.fieldLabel}>Service</Text>
                <View style={styles.chipWrap}>
                  {profile.services.map((s) => (
                    <TouchableOpacity key={s.id} onPress={() => setQuoteService(s.name)} style={[styles.areaChip, quoteService === s.name && styles.areaChipActive]}>
                      <Text style={[styles.areaChipText, quoteService === s.name && { color: '#000', fontWeight: '700' }]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Quantity</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuoteQty(String(Math.max(1, (parseInt(quoteQty, 10) || 1) - 1)))}>
                    <Ionicons name="remove" size={16} color={COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{quoteQty}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuoteQty(String((parseInt(quoteQty, 10) || 1) + 1))}>
                    <Ionicons name="add" size={16} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.estimateRow}>
                  <Text style={styles.estimateLabel}>Estimated cost</Text>
                  <Text style={styles.estimateValue}>{formatPrice(estimate)}</Text>
                </View>
                <TouchableOpacity style={styles.sheetPrimary} onPress={() => setQuoteMode('request')}>
                  <Text style={styles.sheetPrimaryText}>Continue to request</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.sheetTitle}>Request a quotation</Text>
                <Text style={styles.fieldLabel}>Details (optional)</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.inputMultiline}
                    value={quoteMessage}
                    onChangeText={setQuoteMessage}
                    placeholder="Describe the job — size, condition, timeline…"
                    placeholderTextColor={COLORS.textTertiary}
                    multiline
                  />
                </View>
                <GlassCard style={styles.summaryCard}>
                  <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service</Text><Text style={styles.summaryValue}>{quoteService}</Text></View>
                  <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Estimate</Text><Text style={styles.summaryValue}>{formatPrice(estimate)}</Text></View>
                  <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Reply time</Text><Text style={styles.summaryValue}>{profile.responseTime}</Text></View>
                </GlassCard>
                <TouchableOpacity style={styles.sheetPrimary} onPress={sendQuote}>
                  <Ionicons name="send" size={16} color="#000" />
                  <Text style={styles.sheetPrimaryText}>Send request</Text>
                </TouchableOpacity>
              </>
            )}
            {!quoteSent && (
              <TouchableOpacity style={styles.sheetClose} onPress={() => { setQuoteOpen(false); setQuoteMode('estimate'); }}>
                <Text style={styles.sheetCloseText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Booking modal */}
      <Modal visible={bookOpen} transparent animationType="slide" onRequestClose={() => setBookOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.md }]}>
            <View style={styles.sheetHandle} />
            {bookSent ? (
              <View style={styles.successWrap}>
                <View style={styles.successCircle}><Ionicons name="calendar" size={28} color="#000" /></View>
                <Text style={styles.successTitle}>Appointment requested</Text>
                <Text style={styles.successText}>You'll get a confirmation once {profile.businessName} accepts.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sheetTitle}>Book an appointment</Text>
                <Text style={styles.fieldLabel}>Service</Text>
                <View style={styles.chipWrap}>
                  {profile.services.map((s) => (
                    <TouchableOpacity key={s.id} onPress={() => setBookService(s.name)} style={[styles.areaChip, bookService === s.name && styles.areaChipActive]}>
                      <Text style={[styles.areaChipText, bookService === s.name && { color: '#000', fontWeight: '700' }]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Pick a day</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
                  {dayOptions.map((d, i) => (
                    <TouchableOpacity key={i} onPress={() => setBookDay(i)} style={[styles.dayOption, bookDay === i && styles.dayOptionActive]}>
                      <Text style={[styles.dayOptionLabel, bookDay === i && { color: '#000' }]}>{d.label}</Text>
                      <Text style={[styles.dayOptionDate, bookDay === i && { color: '#000' }]}>{d.date}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Pick a time</Text>
                <View style={styles.chipWrap}>
                  {slots.map((s, i) => (
                    <TouchableOpacity key={s} onPress={() => setBookSlot(i)} style={[styles.slotChip, bookSlot === i && styles.areaChipActive]}>
                      <Text style={[styles.areaChipText, bookSlot === i && { color: '#000', fontWeight: '700' }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.sheetPrimary, (bookDay === 0 && new Date().getHours() > 18) && { opacity: 0.5 }]}
                  onPress={sendBooking}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#000" />
                  <Text style={styles.sheetPrimaryText}>Request booking</Text>
                </TouchableOpacity>
              </>
            )}
            {!bookSent && (
              <TouchableOpacity style={styles.sheetClose} onPress={() => setBookOpen(false)}>
                <Text style={styles.sheetCloseText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bg: { ...StyleSheet.absoluteFillObject },
  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: 240 },
  coverFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  coverHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md },
  roundBtn: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  identityWrap: { flexDirection: 'row', alignItems: 'flex-end', marginTop: -44, paddingHorizontal: SPACING.md },
  logoFrame: { width: 92, height: 92, borderRadius: RADIUS.xl, backgroundColor: '#111', borderWidth: 3, borderColor: '#000', overflow: 'hidden' },
  logo: { width: '100%', height: '100%' },
  verifiedBadge: { position: 'absolute', right: -4, bottom: -4, width: 26, height: 26, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap', marginTop: 8 },
  name: { ...FONTS.h2, fontSize: 20, lineHeight: 26, flexShrink: 1 },
  emergencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,184,77,0.12)', borderWidth: 1, borderColor: 'rgba(255,184,77,0.4)' },
  emergencyBadgeText: { ...FONTS.caption, fontSize: 10, color: COLORS.warning, fontWeight: '700' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 6 },
  ratingText: { ...FONTS.bodySmall, color: COLORS.text, fontWeight: '700', marginLeft: 4 },
  reviewCount: { ...FONTS.caption, color: COLORS.textTertiary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  metaText: { ...FONTS.caption, color: COLORS.textTertiary },
  metaDot: { color: COLORS.textTertiary },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 8, flexWrap: 'wrap' },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  categoryChipText: { ...FONTS.caption, fontSize: 11, color: '#000', fontWeight: '700' },
  categoryChipOutline: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.borderLight },
  categoryChipTextOutline: { ...FONTS.caption, fontSize: 11, color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', marginHorizontal: SPACING.md, marginTop: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, paddingVertical: SPACING.md },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { ...FONTS.bodyLarge, fontSize: 15, fontVariant: ['tabular-nums'] },
  statLabel: { ...FONTS.caption, color: COLORS.textTertiary },
  badgesRow: { flexDirection: 'row', gap: SPACING.sm, marginHorizontal: SPACING.md, marginTop: SPACING.md },
  trustBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  trustText: { ...FONTS.caption, fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.xl },
  sectionTitle: { ...FONTS.h3, fontSize: 17, lineHeight: 22, marginBottom: SPACING.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionCount: { ...FONTS.caption, color: COLORS.textTertiary, marginBottom: SPACING.md },
  bodyText: { ...FONTS.body, color: COLORS.textSecondary, lineHeight: 24 },
  tagline: { ...FONTS.bodySmall, color: COLORS.primary, fontStyle: 'italic', marginTop: SPACING.sm },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  contactChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  contactChipText: { ...FONTS.caption, color: COLORS.textSecondary },
  warrantyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: 'rgba(0,212,170,0.07)', borderWidth: 1, borderColor: 'rgba(0,212,170,0.2)' },
  warrantyText: { ...FONTS.caption, color: COLORS.textSecondary, flex: 1 },
  promoCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  promoTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm, backgroundColor: COLORS.primary },
  promoTagText: { ...FONTS.caption, fontSize: 11, color: '#000', fontWeight: '800' },
  promoTitle: { ...FONTS.bodySmall, flex: 1 },
  promoBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.bgElevated },
  promoBtnText: { ...FONTS.caption, color: COLORS.primary, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  areaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  areaChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  areaChipText: { ...FONTS.caption, color: COLORS.textSecondary },
  mapPlaceholder: { marginTop: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard, alignItems: 'center', padding: SPACING.lg, gap: 4, overflow: 'hidden' },
  mapText: { ...FONTS.caption, color: COLORS.textTertiary },
  mapGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', marginTop: SPACING.md, gap: 6 },
  mapCell: { width: '22%', aspectRatio: 1, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center' },
  hoursCard: { padding: SPACING.md },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  hoursDay: { ...FONTS.bodySmall, fontWeight: '600' },
  hoursOpen: { ...FONTS.bodySmall, color: COLORS.success },
  serviceCard: { flexDirection: 'row', padding: SPACING.md, marginBottom: SPACING.sm },
  serviceNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  serviceName: { ...FONTS.bodyLarge, fontSize: 15, lineHeight: 20 },
  emergencyBadgeSmall: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,184,77,0.12)' },
  emergencyBadgeSmallText: { ...FONTS.caption, fontSize: 9, color: COLORS.warning, fontWeight: '700' },
  serviceDesc: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 4, lineHeight: 18 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  servicePrice: { ...FONTS.price, fontSize: 16, lineHeight: 20, color: COLORS.primary },
  serviceUnit: { ...FONTS.caption, color: COLORS.textTertiary },
  serviceMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceMetaText: { ...FONTS.caption, fontSize: 11, color: COLORS.textTertiary },
  pkgCard: { width: 240, borderRadius: RADIUS.xl, padding: SPACING.md, gap: 6 },
  pkgHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pkgName: { ...FONTS.bodyLarge, fontSize: 15, flex: 1 },
  popularTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  popularText: { ...FONTS.caption, fontSize: 9, color: '#000', fontWeight: '800' },
  pkgPrice: { ...FONTS.price, fontSize: 22, lineHeight: 28 },
  pkgDesc: { ...FONTS.caption, color: COLORS.textTertiary, minHeight: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { ...FONTS.caption, color: COLORS.textSecondary },
  pkgBtn: { marginTop: SPACING.sm, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  pkgBtnText: { ...FONTS.bodySmall, color: '#000', fontWeight: '700' },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  portfolioImage: { width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * 2) / 3, aspectRatio: 1, borderRadius: RADIUS.md },
  certCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, marginBottom: SPACING.sm },
  certIcon: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center' },
  certName: { ...FONTS.bodySmall, fontWeight: '600' },
  certIssuer: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 2 },
  certVerified: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,212,170,0.12)' },
  certVerifiedText: { ...FONTS.caption, fontSize: 10, color: COLORS.success, fontWeight: '700' },
  teamCard: { width: 110, alignItems: 'center', gap: 4, padding: SPACING.sm, borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  teamAvatar: { width: 56, height: 56, borderRadius: RADIUS.full },
  teamName: { ...FONTS.caption, fontWeight: '600', textAlign: 'center', fontSize: 12 },
  teamRole: { ...FONTS.caption, fontSize: 10, color: COLORS.textTertiary, textAlign: 'center' },
  financeCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, marginTop: SPACING.md },
  financeText: { ...FONTS.caption, color: COLORS.textSecondary, flex: 1 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  aiIcon: { width: 34, height: 34, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  aiSub: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 2 },
  quoteCard: { padding: SPACING.md },
  fieldLabel: { ...FONTS.caption, color: COLORS.textSecondary, marginBottom: 8, fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  qtyBtn: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { ...FONTS.h3, minWidth: 40, textAlign: 'center', fontVariant: ['tabular-nums'] },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, paddingVertical: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  estimateLabel: { ...FONTS.bodySmall, color: COLORS.textTertiary },
  estimateValue: { ...FONTS.price, color: COLORS.primary },
  estimateNote: { ...FONTS.caption, color: COLORS.textTertiary },
  estimateBtn: { marginTop: SPACING.md, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  estimateBtnText: { ...FONTS.bodySmall, color: '#000', fontWeight: '700' },
  ratingSummary: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, marginBottom: SPACING.md },
  bigRating: { ...FONTS.h1, fontSize: 40, lineHeight: 44, color: COLORS.primary },
  ratingCount: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  barLabel: { ...FONTS.caption, width: 10, color: COLORS.textSecondary },
  barTrack: { flex: 1, height: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.bgElevated, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  barCount: { ...FONTS.caption, width: 16, textAlign: 'right', color: COLORS.textTertiary },
  reviewCard: { padding: SPACING.md, marginBottom: SPACING.md },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  avatar: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.bgElevated },
  reviewName: { ...FONTS.bodySmall, fontWeight: '600' },
  reviewDate: { ...FONTS.caption, color: COLORS.textTertiary, marginLeft: 6 },
  reviewText: { ...FONTS.bodySmall, color: COLORS.textSecondary, lineHeight: 21 },
  reviewMedia: { width: '100%', height: 160, borderRadius: RADIUS.md, marginTop: SPACING.md },
  replyBox: { marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.bgCard, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  replyLabel: { ...FONTS.caption, fontSize: 10, color: COLORS.primary, fontWeight: '700', textTransform: 'uppercase' },
  replyText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 },
  replyDate: { ...FONTS.caption, fontSize: 10, color: COLORS.textTertiary, marginTop: 4 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.md },
  viewAllText: { ...FONTS.bodySmall, color: COLORS.primary, fontWeight: '600' },
  faqCard: { padding: SPACING.md, marginBottom: SPACING.sm },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  faqQuestion: { ...FONTS.bodySmall, fontWeight: '600', flex: 1 },
  faqAnswer: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: SPACING.sm, lineHeight: 20 },
  similarCard: { width: 150, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: 4 },
  similarLogo: { width: 48, height: 48, borderRadius: RADIUS.full },
  similarName: { ...FONTS.caption, fontWeight: '700', textAlign: 'center', fontSize: 12 },
  similarSub: { ...FONTS.caption, fontSize: 10, color: COLORS.textTertiary, textAlign: 'center' },
  similarRating: { ...FONTS.caption, fontSize: 11, color: COLORS.textSecondary },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  bottomIcons: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  bottomIconBtn: { alignItems: 'center', gap: 2, paddingHorizontal: 4, minWidth: 52 },
  bottomIconText: { ...FONTS.caption, fontSize: 10, color: COLORS.textSecondary },
  bottomPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 15, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, ...SHADOWS.md },
  bottomPrimaryText: { ...FONTS.button, fontSize: 14, color: '#000' },
  bottomSecondary: { width: 52, height: 52, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0D0D0D', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg, paddingTop: SPACING.md },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: RADIUS.full, backgroundColor: COLORS.bgElevated, marginBottom: SPACING.md },
  sheetTitle: { ...FONTS.h3, marginBottom: SPACING.md },
  inputWrap: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14 },
  inputMultiline: { color: COLORS.text, paddingVertical: 12, minHeight: 88, textAlignVertical: 'top', ...FONTS.bodySmall },
  summaryCard: { padding: SPACING.md, marginTop: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { ...FONTS.caption, color: COLORS.textTertiary },
  summaryValue: { ...FONTS.caption, color: COLORS.text, fontWeight: '600' },
  sheetPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, marginTop: SPACING.lg, ...SHADOWS.md },
  sheetPrimaryText: { ...FONTS.button, fontSize: 15, color: '#000' },
  sheetClose: { alignItems: 'center', paddingVertical: SPACING.md },
  sheetCloseText: { ...FONTS.bodySmall, color: COLORS.textTertiary },
  successWrap: { alignItems: 'center', paddingVertical: SPACING.lg, gap: 6 },
  successCircle: { width: 72, height: 72, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  successTitle: { ...FONTS.h3 },
  successText: { ...FONTS.bodySmall, color: COLORS.textTertiary, textAlign: 'center' },
  dayOption: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, minWidth: 64 },
  dayOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayOptionLabel: { ...FONTS.caption, fontSize: 11, color: COLORS.textSecondary },
  dayOptionDate: { ...FONTS.bodySmall, fontSize: 13, color: COLORS.text, fontWeight: '600' },
  slotChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: RADIUS.md, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
});
