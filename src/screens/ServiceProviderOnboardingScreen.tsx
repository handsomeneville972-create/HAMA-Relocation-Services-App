import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../components/GlassCard';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useProvider } from '../contexts/ProviderContext';
import {
  CATEGORIES,
  DAYS,
  PROVIDER_STEP_LABELS,
  PROVIDER_STEP_KEYS,
  completionScore,
  generateKeywords,
  validateStep,
  ProviderStepKey,
} from '../services/providerOnboardingService';
import { ProviderPackage, ProviderPortfolioItem, ProviderService, ProviderPlanTier } from '../constants/types';
import { formatPrice } from '../utils/currency';

interface Props {
  plan: ProviderPlanTier;
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ACCENT_OPTIONS = ['#FF6A00', '#FFB84D', '#00D4AA', '#5AC8FA', '#FF4D6A', '#A78BFA'];
const LANGUAGES = ['English', 'Swahili', 'French', 'Arabic', 'Kikuyu', 'Luo', 'Kamba', 'Somali'];
const PAYMENT_METHODS = ['M-Pesa', 'Cash', 'Bank Transfer', 'Card'];

const STEP_ICONS: Record<ProviderStepKey, keyof typeof Ionicons.glyphMap> = {
  identity: 'storefront-outline',
  category: 'grid-outline',
  services: 'build-outline',
  areas: 'location-outline',
  hours: 'time-outline',
  pricing: 'pricetags-outline',
  portfolio: 'images-outline',
  certifications: 'ribbon-outline',
  payment: 'wallet-outline',
  branding: 'color-palette-outline',
};

const PRICE_UNITS = ['per job', 'per hour', 'per day', 'per session', 'quote'] as const;

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  multiline,
  maxLength,
  optional,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url';
  multiline?: boolean;
  maxLength?: number;
  optional?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label} {optional ? <Text style={styles.optionalText}>(optional)</Text> : null}
      </Text>
      <View style={styles.inputWrap}>
        {icon ? <Ionicons name={icon} size={16} color={COLORS.textTertiary} style={styles.inputIcon} /> : null}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline, icon && { paddingLeft: 36 }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
        />
      </View>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? '#000' : COLORS.textSecondary} /> : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

export const ServiceProviderOnboardingScreen: React.FC<Props> = ({ plan, navigation }) => {
  const insets = useSafeAreaInsets();
  const { draft, updateDraft, markStepComplete, activateProvider, isProvider } = useProvider();

  const profile = useMemo(() => draft, [draft]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);
  const [expandedCert, setExpandedCert] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const steps = PROVIDER_STEP_KEYS;
  const step = steps[currentIndex];
  const totalSteps = steps.length;

  // ---------- Resume draft ----------
  useEffect(() => {
    if (profile && profile.completedSteps.length > 0 && !resumed) {
      const firstIncomplete = steps.findIndex((s) => !profile.completedSteps.includes(s));
      if (firstIncomplete > 0) {
        setCurrentIndex(firstIncomplete);
        setResumed(true);
      } else {
        setResumed(true);
      }
    }
  }, [profile, resumed, steps]);

  // ---------- Progress bar ----------
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentIndex / totalSteps) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
    fadeAnim.setValue(0);
    Animated.spring(fadeAnim, { toValue: 1, damping: 18, stiffness: 160, useNativeDriver: true }).start();
    setError(null);
  }, [currentIndex, step, totalSteps, fadeAnim, progressAnim]);

  const goNext = useCallback(() => {
    if (!profile) return;
    const validation = validateStep(step, profile);
    if (!validation.valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setError(validation.message || 'Complete this step to continue');
      return;
    }
    markStepComplete(step);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < totalSteps - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [profile, step, currentIndex, totalSteps, markStepComplete]);

  const goBack = useCallback(() => {
    if (currentIndex === 0) {
      navigation.goBack();
    } else {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex, navigation]);

  const handleActivate = useCallback(async () => {
    if (!profile) return;
    const validation = validateStep('branding', profile);
    if (!validation.valid) {
      setError(validation.message || 'Complete this step to continue');
      return;
    }
    setIsActivating(true);
    setTimeout(async () => {
      await activateProvider(plan);
      navigation.replace('SellerDashboard');
    }, 1200);
  }, [profile, plan, activateProvider, navigation]);

  const pickImage = useCallback(async (kind: 'logo' | 'cover', wide?: boolean) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: wide ? [16, 9] : [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateDraft(kind === 'logo' ? { logo: result.assets[0].uri } : { coverImage: result.assets[0].uri });
    }
  }, [updateDraft]);

  const pickPortfolioPhotos = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 12,
      quality: 0.8,
    });
    if (!result.canceled) {
      const items: ProviderPortfolioItem[] = result.assets.map((a, i) => ({
        id: `pf-${Date.now()}-${i}`,
        type: 'photo' as const,
        uri: a.uri,
        title: '',
        description: '',
      }));
      updateDraft({ portfolio: [...(profile?.portfolio || []), ...items] });
    }
  }, [profile, updateDraft]);

  const pickPromoVideo = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateDraft({
        branding: { ...(profile?.branding || { accentColor: '#FF6A00', tagline: '', promoVideo: null }), promoVideo: result.assets[0].uri },
      });
    }
  }, [profile, updateDraft]);

  const pickDocument = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0] && profile) {
      updateDraft({
        documents: [
          ...profile.documents,
          { id: `doc-${Date.now()}`, name: result.assets[0].fileName || 'Verification document', uri: result.assets[0].uri, status: 'pending' },
        ],
      });
    }
  }, [profile, updateDraft]);

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Loading your workspace…</Text>
      </View>
    );
  }

  const completion = completionScore(profile);
  const keywords = generateKeywords(profile);

// ================= STEP RENDERERS =================

  const renderIdentity = () => (
    <>
      <SectionTitle icon="storefront-outline" title="Business identity" subtitle="Tell customers who you are and where to find you." />
      <View style={styles.mediaRow}>
        <TouchableOpacity style={styles.logoPicker} onPress={() => pickImage('logo', false)} activeOpacity={0.8}>
          {profile.logo ? (
            <Image source={{ uri: profile.logo }} style={styles.logoPreview} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
              <Text style={styles.mediaLabel}>Logo</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.coverPicker, { backgroundColor: COLORS.bgCard }]} onPress={() => pickImage('cover', true)} activeOpacity={0.8}>
          {profile.coverImage ? (
            <Image source={{ uri: profile.coverImage }} style={styles.coverPreview} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="image-outline" size={22} color={COLORS.primary} />
              <Text style={styles.mediaLabel}>Cover image</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <Field label="Business name" value={profile.businessName} onChange={(v) => updateDraft({ businessName: v })} placeholder="e.g. Bright Electricians Ltd" icon="storefront-outline" />
      <Field label="Description" value={profile.description} onChange={(v) => updateDraft({ description: v })} placeholder="What do you do? Experience, specialities, why customers should choose you…" multiline maxLength={600} />
      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Years in business</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => updateDraft({ yearsInBusiness: Math.max(1, profile.yearsInBusiness - 1) })}>
              <Ionicons name="remove" size={16} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{profile.yearsInBusiness}</Text>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => updateDraft({ yearsInBusiness: profile.yearsInBusiness + 1 })}>
              <Ionicons name="add" size={16} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Team size</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => updateDraft({ teamSize: Math.max(1, profile.teamSize - 1) })}>
              <Ionicons name="remove" size={16} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{profile.teamSize}</Text>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => updateDraft({ teamSize: profile.teamSize + 1 })}>
              <Ionicons name="add" size={16} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Field label="Phone" value={profile.phone} onChange={(v) => updateDraft({ phone: v })} placeholder="+254 7XX XXX XXX" keyboardType="phone-pad" icon="call-outline" />
      <Field label="Email" value={profile.email} onChange={(v) => updateDraft({ email: v })} placeholder="you@business.com" keyboardType="email-address" icon="mail-outline" />
      <Field label="Website" value={profile.website} onChange={(v) => updateDraft({ website: v })} placeholder="https://" keyboardType="url" optional icon="globe-outline" />
      <Field label="Social media (Instagram, Facebook…)" value={profile.socialMedia.map((s) => s.handle).join(', ')} onChange={(v) =>
        updateDraft({ socialMedia: v.split(',').map((h) => h.trim()).filter(Boolean).map((handle) => ({ platform: 'Social', handle })) })
      } placeholder="@yourhandle, /yourpage" optional icon="at-outline" />
      <Field label="Address" value={profile.address} onChange={(v) => updateDraft({ address: v })} placeholder="Street, building, estate" icon="home-outline" />
      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Field label="County" value={profile.county} onChange={(v) => updateDraft({ county: v })} placeholder="Nairobi" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Town" value={profile.town} onChange={(v) => updateDraft({ town: v })} placeholder="Westlands" />
        </View>
      </View>
      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Field label="Latitude" value={profile.gps ? String(profile.gps.lat) : ''} onChange={(v) => updateDraft({ gps: { lat: parseFloat(v) || 0, lng: profile.gps?.lng || 0 } })} placeholder="-1.2921" keyboardType="numeric" optional />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Longitude" value={profile.gps ? String(profile.gps.lng) : ''} onChange={(v) => updateDraft({ gps: { lat: profile.gps?.lat || 0, lng: parseFloat(v) || 0 } })} placeholder="36.8219" keyboardType="numeric" optional />
        </View>
      </View>
    </>
  );

  const renderCategory = () => (
    <>
      <SectionTitle icon="grid-outline" title="Category & expertise" subtitle="Choose what you do — this drives search ranking." />
      <Text style={styles.fieldLabel}>Category</Text>
      <View style={styles.chipWrap}>
        {CATEGORIES.map((c) => (
          <Chip key={c.value} label={c.value} selected={profile.category === c.value} onPress={() => updateDraft({ category: c.value, subcategory: CATEGORIES.find((x) => x.value === c.value)!.subcategories[0] })} icon={c.value === profile.category ? 'checkmark' : undefined} />
        ))}
      </View>
      <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Subcategory</Text>
      <View style={styles.chipWrap}>
        {CATEGORIES.find((c) => c.value === profile.category)?.subcategories.map((s) => (
          <Chip key={s} label={s} selected={profile.subcategory === s} onPress={() => updateDraft({ subcategory: s })} icon={profile.subcategory === s ? 'checkmark' : undefined} />
        ))}
      </View>
      <GlassCard style={styles.hintCard}>
        <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
        <Text style={styles.hintText}>Your category and subcategory feed the HAMA search engine and public profile badges.</Text>
      </GlassCard>
    </>
  );

  const renderServices = () => {
    const activeService = profile.services.find((s) => s.id === expandedService);
    return (
      <>
        <SectionTitle icon="build-outline" title="Services & pricing" subtitle="List the jobs you handle — clear pricing builds trust." />
        {profile.services.map((svc) => (
          <GlassCard key={svc.id} style={styles.listCard}>
            <View style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{svc.name}</Text>
                <Text style={styles.listSub}>
                  {formatPrice(svc.price)} {svc.priceUnit} · {svc.duration || 'Flexible'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setExpandedService(expandedService === svc.id ? null : svc.id)} style={styles.iconBtn}>
                <Ionicons name={expandedService === svc.id ? 'chevron-up' : 'create-outline'} size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => updateDraft({ services: profile.services.filter((s) => s.id !== svc.id) })} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
            {expandedService === svc.id && (
              <View style={styles.inlineEditor}>
                <Field label="Service name" value={activeService?.name || ''} onChange={(v) => updateDraft({ services: profile.services.map((s) => (s.id === svc.id ? { ...s, name: v } : s)) })} />
                <Field label="Description" value={activeService?.description || ''} onChange={(v) => updateDraft({ services: profile.services.map((s) => (s.id === svc.id ? { ...s, description: v } : s)) })} multiline />
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Price (KSh)</Text>
                    <View style={styles.inputWrap}>
                      <TextInput style={styles.input} value={activeService ? String(activeService.price) : ''} onChangeText={(v) => updateDraft({ services: profile.services.map((s) => (s.id === svc.id ? { ...s, price: parseFloat(v) || 0 } : s)) })} keyboardType="numeric" placeholder="1500" placeholderTextColor={COLORS.textTertiary} />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Unit</Text>
                    <View style={styles.chipWrap}>
                      {PRICE_UNITS.map((u) => (
                        <Chip key={u} label={u} selected={activeService?.priceUnit === u} onPress={() => updateDraft({ services: profile.services.map((s) => (s.id === svc.id ? { ...s, priceUnit: u } : s)) })} />
                      ))}
                    </View>
                  </View>
                </View>
                <Field label="Duration" value={activeService?.duration || ''} onChange={(v) => updateDraft({ services: profile.services.map((s) => (s.id === svc.id ? { ...s, duration: v } : s)) })} placeholder="2-3 hours" />
                <Field label="Warranty" value={activeService?.warranty || ''} onChange={(v) => updateDraft({ services: profile.services.map((s) => (s.id === svc.id ? { ...s, warranty: v } : s)) })} placeholder="3 months" />
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Available for emergencies 24/7</Text>
                  <Switch
                    value={activeService?.emergencyAvailable || false}
                    onValueChange={(v) => updateDraft({ services: profile.services.map((s) => (s.id === svc.id ? { ...s, emergencyAvailable: v } : s)) })}
                    trackColor={{ false: COLORS.bgElevated, true: COLORS.primaryDark }}
                    thumbColor={activeService?.emergencyAvailable ? COLORS.primary : '#888'}
                  />
                </View>
              </View>
            )}
          </GlassCard>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            const id = `svc-${Date.now()}`;
            updateDraft({ services: [...profile.services, { id, name: '', description: '', price: 0, priceUnit: 'per job', duration: '', warranty: '', emergencyAvailable: false, active: true }] });
            setExpandedService(id);
          }}
        >
          <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.addButtonText}>Add a service</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderAreas = () => (
    <>
      <SectionTitle icon="location-outline" title="Service areas" subtitle="Where do you travel to work? Be specific for better matches." />
      <Text style={styles.fieldLabel}>Counties</Text>
      <View style={styles.chipWrap}>
        {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 'Uasin Gishu', 'Kajiado'].map((c) => (
          <Chip key={c} label={c} selected={profile.serviceAreas.counties.includes(c)} onPress={() => updateDraft({ serviceAreas: { ...profile.serviceAreas, counties: profile.serviceAreas.counties.includes(c) ? profile.serviceAreas.counties.filter((x) => x !== c) : [...profile.serviceAreas.counties, c] } })} icon={profile.serviceAreas.counties.includes(c) ? 'checkmark' : undefined} />
        ))}
      </View>
      <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Towns & estates</Text>
      <View style={styles.chipWrap}>
        {['Westlands', 'Kilimani', 'Kasarani', 'Rongai', 'CBD', 'Karen', 'Thika', 'Ruaka', 'Langata', 'South B', 'Donholm', 'Nyali'].map((t) => (
          <Chip key={t} label={t} selected={profile.serviceAreas.towns.includes(t)} onPress={() => updateDraft({ serviceAreas: { ...profile.serviceAreas, towns: profile.serviceAreas.towns.includes(t) ? profile.serviceAreas.towns.filter((x) => x !== t) : [...profile.serviceAreas.towns, t] } })} icon={profile.serviceAreas.towns.includes(t) ? 'checkmark' : undefined} />
        ))}
      </View>
      <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Neighbourhoods</Text>
      <View style={styles.chipWrap}>
        {['Garden City', 'Imara Daima', 'Juja Farm', 'Pipeline', 'Embakasi', 'Utawala'].map((n) => (
          <Chip key={n} label={n} selected={profile.serviceAreas.neighborhoods.includes(n)} onPress={() => updateDraft({ serviceAreas: { ...profile.serviceAreas, neighborhoods: profile.serviceAreas.neighborhoods.includes(n) ? profile.serviceAreas.neighborhoods.filter((x) => x !== n) : [...profile.serviceAreas.neighborhoods, n] } })} icon={profile.serviceAreas.neighborhoods.includes(n) ? 'checkmark' : undefined} />
        ))}
      </View>
      <View style={styles.radiusCard}>
        <Text style={styles.fieldLabel}>Travel radius</Text>
        <View style={styles.radiusRow}>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => updateDraft({ serviceAreas: { ...profile.serviceAreas, radiusKm: Math.max(5, profile.serviceAreas.radiusKm - 5) } })}>
            <Ionicons name="remove" size={16} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.radiusValue}>{profile.serviceAreas.radiusKm} km</Text>
            <View style={styles.radiusTrack}>
              <View style={[styles.radiusFill, { width: `${Math.min(100, (profile.serviceAreas.radiusKm / 100) * 100)}%` }]} />
            </View>
          </View>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => updateDraft({ serviceAreas: { ...profile.serviceAreas, radiusKm: Math.min(100, profile.serviceAreas.radiusKm + 5) } })}>
            <Ionicons name="add" size={16} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderHours = () => (
    <>
      <SectionTitle icon="time-outline" title="Business hours" subtitle="When can customers reach you? Open 24/7 boosts emergency matches." />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Open 24/7 (emergency-friendly)</Text>
        <Switch
          value={profile.open247}
          onValueChange={(v) => updateDraft({ open247: v })}
          trackColor={{ false: COLORS.bgElevated, true: COLORS.primaryDark }}
          thumbColor={profile.open247 ? COLORS.primary : '#888'}
        />
      </View>
      {!profile.open247 &&
        profile.businessHours.map((day) => (
          <GlassCard key={day.day} style={styles.dayCard}>
            <Text style={[styles.dayName, day.closed && { color: COLORS.textTertiary }]}>{day.day}</Text>
            {day.closed ? (
              <Text style={styles.closedText}>Closed</Text>
            ) : (
              <View style={styles.timeRow}>
                <TextInput
                  style={styles.timeInput}
                  value={day.open}
                  onChangeText={(v) => updateDraft({ businessHours: profile.businessHours.map((d) => (d.day === day.day ? { ...d, open: v } : d)) })}
                  placeholder="08:00"
                  placeholderTextColor={COLORS.textTertiary}
                />
                <Text style={styles.timeDash}>to</Text>
                <TextInput
                  style={styles.timeInput}
                  value={day.close}
                  onChangeText={(v) => updateDraft({ businessHours: profile.businessHours.map((d) => (d.day === day.day ? { ...d, close: v } : d)) })}
                  placeholder="18:00"
                  placeholderTextColor={COLORS.textTertiary}
                />
                <TouchableOpacity style={styles.closedToggle} onPress={() => updateDraft({ businessHours: profile.businessHours.map((d) => (d.day === day.day ? { ...d, closed: !d.closed } : d)) })}>
                  <Text style={styles.closedToggleText}>{day.closed ? 'Reopen' : 'Close'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>
        ))}
    </>
  );

  const renderPricing = () => {
    const activePackage = profile.packages.find((p) => p.id === expandedPackage);
    return (
      <>
        <SectionTitle icon="pricetags-outline" title="Pricing structure" subtitle="Set fees and build Bronze, Silver & Gold packages." />
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Field label="Call-out fee (KSh)" value={String(profile.callOutFee)} onChange={(v) => updateDraft({ callOutFee: parseFloat(v) || 0 })} keyboardType="numeric" placeholder="500" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Consultation (KSh)" value={String(profile.consultationFee)} onChange={(v) => updateDraft({ consultationFee: parseFloat(v) || 0 })} keyboardType="numeric" placeholder="0" />
          </View>
        </View>
        <Text style={[styles.fieldLabel, { marginTop: SPACING.sm }]}>Packages</Text>
        {profile.packages.map((pkg) => (
          <GlassCard key={pkg.id} style={styles.listCard}>
            <View style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{pkg.name}</Text>
                <Text style={styles.listSub}>{formatPrice(pkg.price)} · {pkg.features.length} features</Text>
              </View>
              <TouchableOpacity onPress={() => setExpandedPackage(expandedPackage === pkg.id ? null : pkg.id)} style={styles.iconBtn}>
                <Ionicons name={expandedPackage === pkg.id ? 'chevron-up' : 'create-outline'} size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => updateDraft({ packages: profile.packages.filter((p) => p.id !== pkg.id) })} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
            {expandedPackage === pkg.id && (
              <View style={styles.inlineEditor}>
                <Field label="Package name" value={activePackage?.name || ''} onChange={(v) => updateDraft({ packages: profile.packages.map((p) => (p.id === pkg.id ? { ...p, name: v } : p)) })} placeholder="Silver Package" />
                <Field label="Price (KSh)" value={activePackage ? String(activePackage.price) : ''} onChange={(v) => updateDraft({ packages: profile.packages.map((p) => (p.id === pkg.id ? { ...p, price: parseFloat(v) || 0 } : p)) })} keyboardType="numeric" />
                <Field label="Description" value={activePackage?.description || ''} onChange={(v) => updateDraft({ packages: profile.packages.map((p) => (p.id === pkg.id ? { ...p, description: v } : p)) })} multiline />
                <Field label="Features (comma separated)" value={activePackage?.features.join(', ') || ''} onChange={(v) => updateDraft({ packages: profile.packages.map((p) => (p.id === pkg.id ? { ...p, features: v.split(',').map((f) => f.trim()).filter(Boolean) } : p)) })} />
              </View>
            )}
          </GlassCard>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            const id = `pkg-${Date.now()}`;
            const tiers: { name: string; price: number }[] = [
              { name: 'Bronze Package', price: 3000 },
              { name: 'Silver Package', price: 6000 },
              { name: 'Gold Package', price: 12000 },
            ];
            const next = tiers[profile.packages.length] || { name: `Package ${profile.packages.length + 1}`, price: 5000 };
            updateDraft({ packages: [...profile.packages, { id, name: next.name, price: next.price, description: '', features: [] }] });
            setExpandedPackage(id);
          }}
        >
          <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.addButtonText}>Add package</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderPortfolio = () => (
    <>
      <SectionTitle icon="images-outline" title="Portfolio" subtitle="Show your work — at least 5 photos. Proof beats promises." />
      <View style={styles.portfolioGrid}>
        {profile.portfolio.map((item) => (
          <View key={item.id} style={styles.portfolioItem}>
            <Image source={{ uri: item.uri }} style={styles.portfolioImage} />
            <TouchableOpacity style={styles.portfolioRemove} onPress={() => updateDraft({ portfolio: profile.portfolio.filter((p) => p.id !== item.id) })}>
              <Ionicons name="close" size={14} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.portfolioEdit}
              onPress={() => updateDraft({ portfolio: profile.portfolio.map((p) => (p.id === item.id ? { ...p, title: item.title ? '' : p.title || 'Untitled work', description: item.title ? '' : 'Add a short description' } : p)) })}
            >
              <Ionicons name="create-outline" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.portfolioAdd} onPress={pickPortfolioPhotos}>
          <Ionicons name="add" size={28} color={COLORS.primary} />
          <Text style={styles.portfolioAddText}>Add photos</Text>
        </TouchableOpacity>
      </View>
      <GlassCard style={styles.hintCard}>
        <Ionicons name="images-outline" size={16} color={COLORS.primary} />
        <Text style={styles.hintText}>
          {profile.portfolio.filter((p) => p.type === 'photo').length} of 5 minimum photos. Completed jobs and videos are optional extras.
        </Text>
      </GlassCard>
    </>
  );

  const renderCertifications = () => {
    const activeCert = profile.certifications.find((c) => c.id === expandedCert);
    return (
      <>
        <SectionTitle icon="ribbon-outline" title="Certifications & verification" subtitle="Proof of training builds trust and unlocks the verified badge." />
        {profile.certifications.map((cert) => (
          <GlassCard key={cert.id} style={styles.listCard}>
            <View style={styles.listRow}>
              <View style={styles.certBadge}>
                <Ionicons name={cert.verified ? 'shield-checkmark' : 'shield-outline'} size={18} color={cert.verified ? COLORS.success : COLORS.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{cert.name}</Text>
                <Text style={styles.listSub}>{cert.issuer} · {cert.year}</Text>
              </View>
              <TouchableOpacity onPress={() => setExpandedCert(expandedCert === cert.id ? null : cert.id)} style={styles.iconBtn}>
                <Ionicons name={expandedCert === cert.id ? 'chevron-up' : 'create-outline'} size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => updateDraft({ certifications: profile.certifications.filter((c) => c.id !== cert.id) })} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
            {expandedCert === cert.id && (
              <View style={styles.inlineEditor}>
                <Field label="Certification" value={activeCert?.name || ''} onChange={(v) => updateDraft({ certifications: profile.certifications.map((c) => (c.id === cert.id ? { ...c, name: v } : c)) })} placeholder="e.g. NITA Electrical License" />
                <Field label="Issuer" value={activeCert?.issuer || ''} onChange={(v) => updateDraft({ certifications: profile.certifications.map((c) => (c.id === cert.id ? { ...c, issuer: v } : c)) })} placeholder="e.g. NITA, EPRA" />
                <Field label="Year" value={String(activeCert?.year || '')} onChange={(v) => updateDraft({ certifications: profile.certifications.map((c) => (c.id === cert.id ? { ...c, year: parseInt(v) || new Date().getFullYear() } : c)) })} keyboardType="numeric" />
              </View>
            )}
          </GlassCard>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            const id = `cert-${Date.now()}`;
            updateDraft({ certifications: [...profile.certifications, { id, name: '', issuer: '', year: new Date().getFullYear(), verified: false }] });
            setExpandedCert(id);
          }}
        >
          <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.addButtonText}>Add certification</Text>
        </TouchableOpacity>
        <View style={[styles.docsHeader, { marginTop: SPACING.lg }]}>
          <Text style={styles.fieldLabel}>Verification documents</Text>
          <TouchableOpacity style={styles.smallBtn} onPress={pickDocument}>
            <Ionicons name="cloud-upload-outline" size={14} color={COLORS.primary} />
            <Text style={styles.smallBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>
        {profile.documents.map((doc) => (
          <GlassCard key={doc.id} style={styles.listCard}>
            <View style={styles.listRow}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
              <Text style={[styles.listSub, { flex: 1, marginLeft: SPACING.sm }]}>{doc.name}</Text>
              <Text style={[styles.docStatus, doc.status === 'verified' && { color: COLORS.success }]}>{doc.status}</Text>
            </View>
          </GlassCard>
        ))}
      </>
    );
  };

  const renderPayment = () => (
    <>
      <SectionTitle icon="wallet-outline" title="Payment preferences" subtitle="How do you get paid? Payouts go to M-Pesa or your bank." />
      <Text style={styles.fieldLabel}>Accepted methods</Text>
      <View style={styles.chipWrap}>
        {PAYMENT_METHODS.map((m) => (
          <Chip key={m} label={m} selected={profile.paymentMethods.includes(m)} onPress={() => updateDraft({ paymentMethods: profile.paymentMethods.includes(m) ? profile.paymentMethods.filter((x) => x !== m) : [...profile.paymentMethods, m] })} icon={profile.paymentMethods.includes(m) ? 'checkmark' : undefined} />
        ))}
      </View>
      <View style={{ marginTop: SPACING.md }}>
        <Field label="M-Pesa payout number" value={profile.mpesaNumber} onChange={(v) => updateDraft({ mpesaNumber: v })} placeholder="+254 7XX XXX XXX" keyboardType="phone-pad" icon="phone-portrait-outline" />
      </View>
      <GlassCard style={styles.hintCard}>
        <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
        <Text style={styles.hintText}>Payouts are processed every Friday. The first payout is released 7 days after your first completed job.</Text>
      </GlassCard>
      {profile.bankAccount ? (
        <GlassCard style={styles.listCard}>
          <View style={styles.listRow}>
            <Ionicons name="business-outline" size={18} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.listTitle}>{profile.bankAccount.bankName}</Text>
              <Text style={styles.listSub}>{profile.bankAccount.accountName} · {profile.bankAccount.accountNumber}</Text>
            </View>
            <TouchableOpacity onPress={() => updateDraft({ bankAccount: null })} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </GlassCard>
      ) : (
        <View style={{ marginTop: SPACING.md }}>
          <TouchableOpacity style={styles.addButton} onPress={() => updateDraft({ bankAccount: { bankName: '', accountName: '', accountNumber: '' } })}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.addButtonText}>Add bank account (optional)</Text>
          </TouchableOpacity>
        </View>
      )}
      {profile.bankAccount && (
        <View style={styles.inlineEditor}>
          <Field label="Bank" value={profile.bankAccount.bankName} onChange={(v) => updateDraft({ bankAccount: { ...profile.bankAccount!, bankName: v } })} placeholder="e.g. Equity" />
          <Field label="Account name" value={profile.bankAccount.accountName} onChange={(v) => updateDraft({ bankAccount: { ...profile.bankAccount!, accountName: v } })} />
          <Field label="Account number" value={profile.bankAccount.accountNumber} onChange={(v) => updateDraft({ bankAccount: { ...profile.bankAccount!, accountNumber: v } })} keyboardType="numeric" />
        </View>
      )}
    </>
  );

  const renderBranding = () => (
    <>
      <SectionTitle icon="color-palette-outline" title="Branding & languages" subtitle="Personalise your storefront. Optional but it lifts your completeness score." />
      <Text style={styles.fieldLabel}>Accent colour</Text>
      <View style={styles.colorRow}>
        {ACCENT_OPTIONS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => updateDraft({ branding: { ...profile.branding, accentColor: c } })}
            style={[styles.colorSwatch, { backgroundColor: c }, profile.branding.accentColor === c && styles.colorSwatchActive]}
          >
            {profile.branding.accentColor === c ? <Ionicons name="checkmark" size={16} color="#000" /> : null}
          </TouchableOpacity>
        ))}
      </View>
      <Field label="Tagline" value={profile.branding.tagline} onChange={(v) => updateDraft({ branding: { ...profile.branding, tagline: v } })} placeholder="e.g. Fast, reliable repairs across Nairobi" />
      <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Languages</Text>
      <View style={styles.chipWrap}>
        {LANGUAGES.map((l) => (
          <Chip key={l} label={l} selected={profile.languages.includes(l)} onPress={() => updateDraft({ languages: profile.languages.includes(l) ? profile.languages.filter((x) => x !== l) : [...profile.languages, l] })} icon={profile.languages.includes(l) ? 'checkmark' : undefined} />
        ))}
      </View>
      <View style={[styles.docsHeader, { marginTop: SPACING.lg }]}>
        <Text style={styles.fieldLabel}>Promo video (optional)</Text>
        <TouchableOpacity style={styles.smallBtn} onPress={pickPromoVideo}>
          <Ionicons name="videocam-outline" size={14} color={COLORS.primary} />
          <Text style={styles.smallBtnText}>{profile.branding.promoVideo ? 'Replace' : 'Upload'}</Text>
        </TouchableOpacity>
      </View>
      {profile.branding.promoVideo && (
        <GlassCard style={styles.listCard}>
          <Ionicons name="play-circle" size={18} color={COLORS.primary} />
          <Text style={[styles.listSub, { flex: 1, marginLeft: SPACING.sm }]}>Promo video ready</Text>
          <TouchableOpacity onPress={() => updateDraft({ branding: { ...profile.branding, promoVideo: null } })} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </GlassCard>
      )}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Offer 24/7 emergency service</Text>
        <Switch
          value={profile.isEmergencyProvider}
          onValueChange={(v) => updateDraft({ isEmergencyProvider: v })}
          trackColor={{ false: COLORS.bgElevated, true: COLORS.primaryDark }}
          thumbColor={profile.isEmergencyProvider ? COLORS.primary : '#888'}
        />
      </View>
    </>
  );

  const renderReview = () => (
    <>
      <SectionTitle icon="checkmark-done-outline" title="Review & launch" subtitle="Everything looks great. Here's what customers will see." />
      <LinearGradient colors={COLORS.gradientCard} style={styles.scoreCard}>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreValue}>{completion.total}%</Text>
          <Text style={styles.scoreLabel}>complete</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.scoreTitle}>Profile completeness</Text>
          <Text style={styles.scoreSub}>100% unlocks the top search tier and Trusted badge.</Text>
        </View>
      </LinearGradient>
      <View style={styles.sectionCheckWrap}>
        {completion.sections.map((s) => (
          <View key={s.key} style={styles.sectionCheckRow}>
            <Ionicons name={s.done >= s.total ? 'checkmark-circle' : s.done > 0 ? 'ellipse-outline' : 'ellipse'} size={18} color={s.done >= s.total ? COLORS.success : COLORS.textTertiary} />
            <Text style={[styles.sectionCheckText, s.done < s.total && { color: COLORS.textTertiary }]}>{s.label}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Auto-generated search keywords</Text>
      <View style={styles.chipWrap}>
        {keywords.slice(0, 14).map((k) => (
          <Chip key={k} label={k} selected onPress={() => {}} />
        ))}
      </View>
      <GlassCard style={styles.planCard}>
        <Ionicons name={plan === 'Premium' ? 'diamond' : 'sparkles'} size={18} color={COLORS.primary} />
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.listTitle}>{plan} plan active</Text>
          <Text style={styles.listSub}>
            {plan === 'Premium' ? 'Top-of-search priority, verified badge & full analytics.' : 'Search ranking boost, public profile & quotes.'}
          </Text>
        </View>
      </GlassCard>
      <View style={styles.emergencyRow}>
        <Ionicons name={profile.isEmergencyProvider ? 'flash' : 'flash-outline'} size={16} color={profile.isEmergencyProvider ? COLORS.warning : COLORS.textTertiary} />
        <Text style={styles.emergencyText}>{profile.isEmergencyProvider ? 'Listed as an emergency provider' : 'Not marked for emergency requests'}</Text>
      </View>
    </>
  );

  const renderStep = () => {
    if (isReview) return renderReview();
    switch (step) {
      case 'identity': return renderIdentity();
      case 'category': return renderCategory();
      case 'services': return renderServices();
      case 'areas': return renderAreas();
      case 'hours': return renderHours();
      case 'pricing': return renderPricing();
      case 'portfolio': return renderPortfolio();
      case 'certifications': return renderCertifications();
      case 'payment': return renderPayment();
      case 'branding': return renderBranding();
    }
  };

  const isReview = currentIndex === totalSteps - 1;
  const stepValid = validateStep(step, profile).valid;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <LinearGradient colors={COLORS.gradientNight} style={styles.bg} />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>Become a Service Provider</Text>
              <Text style={styles.headerStep}>{currentIndex + 1}/{totalSteps}</Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <Text style={styles.headerSub}>{isReview ? 'Review & launch' : PROVIDER_STEP_LABELS[step]}</Text>
          </View>
        </View>

        {/* Resume banner */}
        {resumed && currentIndex > 0 && (
          <View style={styles.resumeBanner}>
            <Ionicons name="cloud-done-outline" size={16} color={COLORS.success} />
            <Text style={styles.resumeText}>Draft restored — changes autosave as you go.</Text>
          </View>
        )}

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: 180 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
            {renderStep()}
          </Animated.View>
        </ScrollView>

        {/* Error toast */}
        {error && (
          <View style={styles.errorToast}>
            <Ionicons name="alert-circle" size={16} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Footer */}
        <LinearGradient colors={['rgba(0,0,0,0)', '#000']} style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
          <View style={styles.footerRow}>
            {!isReview && (
              <TouchableOpacity style={styles.footerSecondary} onPress={goBack} disabled={currentIndex === 0}>
                <Ionicons name="arrow-back" size={18} color={currentIndex === 0 ? COLORS.textTertiary : COLORS.textSecondary} />
                <Text style={[styles.footerSecondaryText, currentIndex === 0 && { color: COLORS.textTertiary }]}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.footerPrimary, !stepValid && !isReview && styles.footerPrimaryMuted]}
              onPress={isReview ? handleActivate : goNext}
              disabled={isActivating}
            >
              {isActivating ? (
                <ActivityIndicator size="small" color="#000" />
              ) : isReview ? (
                <>
                  <Ionicons name="rocket" size={18} color="#000" />
                  <Text style={styles.footerPrimaryText}>Activate business</Text>
                </>
              ) : (
                <>
                  <Text style={styles.footerPrimaryText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bg: { ...StyleSheet.absoluteFillObject },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  headerBtn: { width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { ...FONTS.h3, fontSize: 16, lineHeight: 20 },
  headerStep: { ...FONTS.caption, color: COLORS.textTertiary, fontVariant: ['tabular-nums'] },
  headerSub: { ...FONTS.caption, color: COLORS.primary, marginTop: 2 },
  progressTrack: { height: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.bgElevated, marginTop: SPACING.sm, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  resumeBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginHorizontal: SPACING.md, marginBottom: SPACING.sm, padding: SPACING.sm + 2, borderRadius: RADIUS.md, backgroundColor: 'rgba(0,212,170,0.08)', borderWidth: 1, borderColor: 'rgba(0,212,170,0.25)' },
  resumeText: { ...FONTS.caption, color: COLORS.success, flex: 1 },
  field: { marginBottom: SPACING.md },
  fieldLabel: { ...FONTS.caption, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '600' },
  optionalText: { color: COLORS.textTertiary, fontWeight: '400' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  inputIcon: { position: 'absolute', left: 12 },
  input: { flex: 1, color: COLORS.text, paddingHorizontal: 14, paddingVertical: 12, ...FONTS.body },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: SPACING.md },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { ...FONTS.caption, color: COLORS.textSecondary },
  chipTextSelected: { color: '#000', fontWeight: '700' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  sectionIcon: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,107,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...FONTS.h3 },
  sectionSubtitle: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 2 },
  mediaRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  logoPicker: { width: 96, height: 96, borderRadius: RADIUS.xl, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  logoPreview: { width: '100%', height: '100%' },
  logoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  coverPicker: { flex: 1, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  coverPreview: { width: '100%', height: '100%' },
  mediaLabel: { ...FONTS.caption, color: COLORS.textTertiary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 4 },
  stepperBtn: { width: 34, height: 34, borderRadius: RADIUS.sm + 2, backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { ...FONTS.bodyLarge, minWidth: 32, textAlign: 'center', fontVariant: ['tabular-nums'] },
  hintCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.lg, padding: SPACING.md },
  hintText: { ...FONTS.caption, color: COLORS.textSecondary, flex: 1 },
  listCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  listTitle: { ...FONTS.bodyLarge, fontSize: 15, lineHeight: 20 },
  listSub: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 2 },
  iconBtn: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  inlineEditor: { marginTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.borderActive, marginTop: SPACING.sm },
  addButtonText: { ...FONTS.bodySmall, color: COLORS.primary, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  switchLabel: { ...FONTS.bodySmall, color: COLORS.textSecondary, flex: 1, marginRight: SPACING.md },
  radiusCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginTop: SPACING.lg },
  radiusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  radiusValue: { ...FONTS.bodyLarge, fontVariant: ['tabular-nums'] },
  radiusTrack: { height: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.bgElevated, marginTop: 6, width: '100%', overflow: 'hidden' },
  radiusFill: { height: '100%', borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  dayCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm, padding: SPACING.md },
  dayName: { ...FONTS.bodyLarge, fontSize: 15, width: 48 },
  closedText: { ...FONTS.bodySmall, color: COLORS.textTertiary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { width: 56, color: COLORS.text, backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 8, textAlign: 'center', ...FONTS.caption },
  timeDash: { color: COLORS.textTertiary, ...FONTS.caption },
  closedToggle: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,77,106,0.1)' },
  closedToggleText: { ...FONTS.caption, color: COLORS.error, fontWeight: '600' },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  portfolioItem: { width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * 2) / 3, aspectRatio: 1, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: COLORS.bgCard },
  portfolioImage: { width: '100%', height: '100%' },
  portfolioRemove: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  portfolioEdit: { position: 'absolute', bottom: 6, right: 6, width: 24, height: 24, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  portfolioAdd: { width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * 2) / 3, aspectRatio: 1, borderRadius: RADIUS.md, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.borderActive, alignItems: 'center', justifyContent: 'center', gap: 4 },
  portfolioAddText: { ...FONTS.caption, color: COLORS.primary },
  certBadge: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center' },
  docsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,107,0,0.12)' },
  smallBtnText: { ...FONTS.caption, color: COLORS.primary, fontWeight: '600' },
  docStatus: { ...FONTS.caption, color: COLORS.warning, textTransform: 'capitalize' },
  colorRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  colorSwatch: { width: 40, height: 40, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  colorSwatchActive: { borderWidth: 2, borderColor: '#fff' },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  scoreRing: { width: 76, height: 76, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,107,0,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.primary },
  scoreValue: { ...FONTS.price, color: COLORS.primary, fontVariant: ['tabular-nums'] },
  scoreLabel: { ...FONTS.caption, color: COLORS.textSecondary },
  scoreTitle: { ...FONTS.bodyLarge },
  scoreSub: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 2 },
  sectionCheckWrap: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  sectionCheckRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 5 },
  sectionCheckText: { ...FONTS.bodySmall, flex: 1 },
  planCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, marginTop: SPACING.md },
  emergencyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  emergencyText: { ...FONTS.caption, color: COLORS.textSecondary },
  errorToast: { position: 'absolute', bottom: 140, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(255,77,106,0.12)', borderWidth: 1, borderColor: 'rgba(255,77,106,0.35)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  errorText: { ...FONTS.caption, color: COLORS.error },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  footerRow: { flexDirection: 'row', gap: SPACING.md },
  footerSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, paddingVertical: 16, borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  footerSecondaryText: { ...FONTS.button, color: COLORS.textSecondary, fontSize: 15 },
  footerPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, flex: 2.2, paddingVertical: 16, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, ...SHADOWS.md },
  footerPrimaryMuted: { opacity: 0.6 },
  footerPrimaryText: { ...FONTS.button, color: '#000', fontSize: 15 },
});
