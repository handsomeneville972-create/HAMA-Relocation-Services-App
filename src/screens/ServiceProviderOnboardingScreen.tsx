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
  Alert,
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
  PROVIDER_STEP_KEYS,
  PROVIDER_STEP_LABELS,
  completionScore,
  generateKeywords,
  isValidKenyanPhone,
  normalizeKenyanPhone,
  profileStrength,
  validateStep,
  ProviderStepKey,
} from '../services/providerOnboardingService';
import {
  ProviderCertification,
  ProviderDocument,
  ProviderPackage,
  ProviderPortfolioItem,
  ProviderProfile,
  ProviderService,
} from '../constants/types';
import { formatPrice } from '../utils/currency';

interface Props {
  plan?: string;
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ACCENT_OPTIONS = ['#FF6A00', '#FFB84D', '#00D4AA', '#5AC8FA', '#FF4D6A', '#A78BFA'];
const LANGUAGES = ['English', 'Swahili', 'French', 'Arabic', 'Kikuyu', 'Luo', 'Kamba', 'Somali'];
const PAYMENT_METHODS = ['M-Pesa', 'Cash', 'Bank Transfer', 'Card'];
const WORKER_TYPES = ['Individual', 'Freelancer', 'Casual Worker', 'Professional', 'Company'];
const PRICE_UNITS = ['per job', 'per hour', 'per day', 'per session', 'quote'] as const;
const MAX_WORK_PHOTOS = 5;
const MAX_CERTIFICATIONS = 3;
const MAX_DOCUMENTS = 4;

const STEP_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  basic: 'person-circle-outline',
  service: 'construct-outline',
  portfolio: 'images-outline',
  boost: 'rocket-outline',
  review: 'checkmark-done-outline',
};

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
  helper,
  onBlur,
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
  helper?: string;
  onBlur?: () => void;
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
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
        />
      </View>
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);
  const [expandedCert, setExpandedCert] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const steps = PROVIDER_STEP_KEYS;
  const totalSteps = steps.length + 1; // 4 data steps + Review
  const isReview = currentIndex === totalSteps - 1;
  const step = steps[currentIndex];
  const stepValid = isReview ? true : profile ? validateStep(step, profile).valid : false;

  // ---------- Resume draft ----------
  useEffect(() => {
    if (profile && profile.completedSteps.length > 0 && !resumed) {
      const newKeys = PROVIDER_STEP_KEYS;
      const firstIncomplete = newKeys.findIndex((s) => !profile.completedSteps.includes(s));
      if (firstIncomplete > 0) {
        setCurrentIndex(firstIncomplete);
        setResumed(true);
      } else {
        setResumed(true);
      }
    }
  }, [profile, resumed]);

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

  const handlePublish = useCallback(async () => {
    if (!profile) return;
    setIsPublishing(true);
    // Small delay so the button feedback lands before the success view.
    await new Promise((r) => setTimeout(r, 600));
    await activateProvider(plan as any);
    setPublished(true);
    setIsPublishing(false);
  }, [profile, plan, activateProvider]);

  const pickLogo = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateDraft({ logo: result.assets[0].uri });
    }
  }, [updateDraft]);

  const pickPortfolioPhotos = useCallback(async () => {
    if (!profile) return;
    const current = profile.portfolio.filter((p) => p.type === 'photo').length;
    if (current >= MAX_WORK_PHOTOS) {
      Alert.alert('Portfolio full', `You can add up to ${MAX_WORK_PHOTOS} work photos for the best ranking.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_WORK_PHOTOS - current,
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
      updateDraft({ portfolio: [...(profile.portfolio || []), ...items] });
    }
  }, [profile, updateDraft]);

  const pickDocument = useCallback(async () => {
    if (!profile) return;
    if (profile.documents.length >= MAX_DOCUMENTS) {
      Alert.alert('Documents full', `You can upload up to ${MAX_DOCUMENTS} documents.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      const doc: ProviderDocument = {
        id: `doc-${Date.now()}`,
        name: result.assets[0].fileName || 'Verification document',
        uri: result.assets[0].uri,
        status: 'pending',
      };
      updateDraft({ documents: [...profile.documents, doc] });
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

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Loading your workspace…</Text>
      </View>
    );
  }

  const strength = profileStrength(profile);
  const completion = completionScore(profile);
  const keywords = generateKeywords(profile);

  const setServices = (services: ProviderService[]) => updateDraft({ services });

  // ================= STEP RENDERERS =================

  const renderBasic = () => (
    <>
      <SectionTitle icon="person-circle-outline" title="Basic information" subtitle="How clients will know and contact you." />
      <Text style={styles.fieldLabel}>Profile photo</Text>
      <TouchableOpacity style={styles.photoPicker} onPress={pickLogo} activeOpacity={0.8}>
        {profile.logo ? (
          <Image source={{ uri: profile.logo }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
            <Text style={styles.mediaLabel}>Add a clear photo</Text>
          </View>
        )}
        {profile.logo && (
          <View style={styles.photoChangeBadge}>
            <Ionicons name="create-outline" size={14} color="#000" />
            <Text style={styles.photoChangeText}>Change</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.helperText}>A bright, recent photo of your face makes your profile easier to trust and more likely to receive requests.</Text>
      <Field label="Business name" value={profile.businessName} onChange={(v) => updateDraft({ businessName: v })} placeholder="e.g. Bright Electricians Ltd" icon="storefront-outline" />
      <Field
        label="Client contact phone"
        value={profile.phone}
        onChange={(v) => updateDraft({ phone: v })}
        onBlur={() => {
          if (profile.phone.trim()) updateDraft({ phone: normalizeKenyanPhone(profile.phone) });
        }}
        placeholder="0712 345 678"
        keyboardType="phone-pad"
        icon="call-outline"
        helper="Required: this number will be shown to clients so they can call you directly."
      />
      {profile.phone.trim().length > 0 && !isValidKenyanPhone(profile.phone) && (
        <Text style={styles.inlineError}>Enter a valid Kenyan mobile number, such as 0712 345 678.</Text>
      )}
      <Field label="Email" value={profile.email} onChange={(v) => updateDraft({ email: v })} placeholder="you@business.com" keyboardType="email-address" icon="mail-outline" optional />
      <Field label="Description" value={profile.description} onChange={(v) => updateDraft({ description: v })} placeholder="What do you do? Experience, specialities, why customers should choose you…" multiline maxLength={600} helper={`${profile.description.trim().length}/30 characters minimum`} />
    </>
  );

  const renderService = () => (
    <>
      <SectionTitle icon="construct-outline" title="Service information" subtitle="Tell us about your work — this drives search ranking." />
      <Text style={styles.fieldLabel}>Worker type</Text>
      <View style={styles.chipWrap}>
        {WORKER_TYPES.map((t) => (
          <Chip key={t} label={t} selected={profile.workerType === t} onPress={() => updateDraft({ workerType: t })} icon={profile.workerType === t ? 'checkmark' : undefined} />
        ))}
      </View>
      <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Category</Text>
      <View style={styles.chipWrap}>
        {CATEGORIES.map((c) => (
          <Chip key={c.value} label={c.value} selected={profile.category === c.value} onPress={() => updateDraft({ category: c.value, subcategory: CATEGORIES.find((x) => x.value === c.value)!.subcategories[0] })} icon={profile.category === c.value ? 'checkmark' : undefined} />
        ))}
      </View>
      <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Specialty</Text>
      <View style={styles.chipWrap}>
        {CATEGORIES.find((c) => c.value === profile.category)?.subcategories.map((s) => (
          <Chip key={s} label={s} selected={profile.subcategory === s} onPress={() => updateDraft({ subcategory: s })} icon={profile.subcategory === s ? 'checkmark' : undefined} />
        ))}
      </View>

      <View style={styles.divider} />
      <Text style={styles.fieldLabel}>Services & pricing</Text>
      {profile.services.map((svc) => (
        <GlassCard key={svc.id} style={styles.listCard}>
          <View style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle}>{svc.name || 'Untitled service'}</Text>
              <Text style={styles.listSub}>
                {svc.price > 0 ? `${formatPrice(svc.price)} ${svc.priceUnit}` : 'Price on quote'} · {svc.duration || 'Flexible'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setExpandedService(expandedService === svc.id ? null : svc.id)} style={styles.iconBtn}>
              <Ionicons name={expandedService === svc.id ? 'chevron-up' : 'create-outline'} size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setServices(profile.services.filter((s) => s.id !== svc.id))} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
          {expandedService === svc.id && (
            <View style={styles.inlineEditor}>
              <Field label="Service name" value={svc.name} onChange={(v) => setServices(profile.services.map((s) => (s.id === svc.id ? { ...s, name: v } : s)))} placeholder="e.g. Fault repair" />
              <Field label="Description" value={svc.description} onChange={(v) => setServices(profile.services.map((s) => (s.id === svc.id ? { ...s, description: v } : s)))} multiline />
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Price (KSh)</Text>
                  <View style={styles.inputWrap}>
                    <TextInput style={styles.input} value={svc.price ? String(svc.price) : ''} onChangeText={(v) => setServices(profile.services.map((s) => (s.id === svc.id ? { ...s, price: parseFloat(v) || 0 } : s)))} keyboardType="numeric" placeholder="1500" placeholderTextColor={COLORS.textTertiary} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Unit</Text>
                  <View style={styles.chipWrap}>
                    {PRICE_UNITS.map((u) => (
                      <Chip key={u} label={u} selected={svc.priceUnit === u} onPress={() => setServices(profile.services.map((s) => (s.id === svc.id ? { ...s, priceUnit: u } : s)))} />
                    ))}
                  </View>
                </View>
              </View>
              <Field label="Duration" value={svc.duration} onChange={(v) => setServices(profile.services.map((s) => (s.id === svc.id ? { ...s, duration: v } : s)))} placeholder="2-3 hours" />
              <Field label="Warranty" value={svc.warranty} onChange={(v) => setServices(profile.services.map((s) => (s.id === svc.id ? { ...s, warranty: v } : s)))} placeholder="3 months" />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Available for emergencies 24/7</Text>
                <Switch
                  value={svc.emergencyAvailable}
                  onValueChange={(v) => setServices(profile.services.map((s) => (s.id === svc.id ? { ...s, emergencyAvailable: v } : s)))}
                  trackColor={{ false: COLORS.bgElevated, true: COLORS.primaryDark }}
                  thumbColor={svc.emergencyAvailable ? COLORS.primary : '#888'}
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
          setServices([...profile.services, { id, name: '', description: '', price: 0, priceUnit: 'per job', duration: '', warranty: '', emergencyAvailable: false, active: true }]);
          setExpandedService(id);
        }}
      >
        <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
        <Text style={styles.addButtonText}>Add a service</Text>
      </TouchableOpacity>

      <View style={styles.divider} />
      <Text style={styles.fieldLabel}>Pricing type</Text>
      <View style={styles.chipWrap}>
        {(['fixed', 'quote'] as const).map((p) => (
          <Chip key={p} label={p === 'fixed' ? 'Fixed Price' : 'Quote Price'} selected={profile.pricingType === p} onPress={() => updateDraft({ pricingType: p })} icon={profile.pricingType === p ? 'checkmark' : undefined} />
        ))}
      </View>
      <Field label="Starting price (KSh)" value={profile.startingPrice > 0 ? String(profile.startingPrice) : ''} onChange={(v) => updateDraft({ startingPrice: parseFloat(v) || 0 })} keyboardType="numeric" placeholder="e.g. 1500" optional icon="pricetag-outline" helper="Optional ranking boost — showing a realistic starting price helps clients decide faster." />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Available now</Text>
        <Switch
          value={profile.availability !== false}
          onValueChange={(v) => updateDraft({ availability: v })}
          trackColor={{ false: COLORS.bgElevated, true: COLORS.primaryDark }}
          thumbColor={profile.availability !== false ? COLORS.primary : '#888'}
        />
      </View>
    </>
  );

  const renderPortfolio = () => (
    <>
      <SectionTitle icon="images-outline" title="Portfolio & experience" subtitle="Showcase your work. Optional, but clear proof wins clients." />
      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Years of experience</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => updateDraft({ yearsInBusiness: Math.max(0, profile.yearsInBusiness - 1) })}>
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
      <View style={[styles.docsHeader, { marginTop: SPACING.sm }]}>
        <Text style={styles.fieldLabel}>Work photos</Text>
        <Text style={styles.helperText}>{profile.portfolio.filter((p) => p.type === 'photo').length}/{MAX_WORK_PHOTOS} added · ranking boost</Text>
      </View>
      <View style={styles.portfolioGrid}>
        {profile.portfolio.map((item) => (
          <View key={item.id} style={styles.portfolioItem}>
            <Image source={{ uri: item.uri }} style={styles.portfolioImage} />
            <TouchableOpacity style={styles.portfolioRemove} onPress={() => updateDraft({ portfolio: profile.portfolio.filter((p) => p.id !== item.id) })}>
              <Ionicons name="close" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.portfolioAdd} onPress={pickPortfolioPhotos}>
          <Ionicons name="add" size={28} color={COLORS.primary} />
          <Text style={styles.portfolioAddText}>Add photos</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.helperText}>Clear photos of real completed work improve your ranking and help clients choose you.</Text>

      <View style={styles.divider} />
      <Text style={styles.fieldLabel}>Certifications</Text>
      <Text style={styles.helperText}>Genuine trade certificates, diplomas or reference letters — up to {MAX_CERTIFICATIONS}. Highest ranking boost.</Text>
      {profile.certifications.map((cert) => (
        <GlassCard key={cert.id} style={styles.listCard}>
          <View style={styles.listRow}>
            <View style={styles.certBadge}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle}>{cert.name || 'Untitled certification'}</Text>
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
              <Field label="Certification" value={cert.name} onChange={(v) => updateDraft({ certifications: profile.certifications.map((c) => (c.id === cert.id ? { ...c, name: v } : c)) })} placeholder="e.g. NITA Electrical License" />
              <Field label="Issuer" value={cert.issuer} onChange={(v) => updateDraft({ certifications: profile.certifications.map((c) => (c.id === cert.id ? { ...c, issuer: v } : c)) })} placeholder="e.g. NITA, EPRA" />
              <Field label="Year" value={String(cert.year || '')} onChange={(v) => updateDraft({ certifications: profile.certifications.map((c) => (c.id === cert.id ? { ...c, year: parseInt(v) || new Date().getFullYear() } : c)) })} keyboardType="numeric" />
            </View>
          )}
        </GlassCard>
      ))}
      {profile.certifications.length < MAX_CERTIFICATIONS && (
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
      )}

      <View style={[styles.docsHeader, { marginTop: SPACING.lg }]}>
        <Text style={styles.fieldLabel}>Supporting documents</Text>
        <TouchableOpacity style={styles.smallBtn} onPress={pickDocument}>
          <Ionicons name="cloud-upload-outline" size={14} color={COLORS.primary} />
          <Text style={styles.smallBtnText}>Upload</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.helperText}>Upload photos of your documents only — never personal identity documents such as your national ID.</Text>
      {profile.documents.map((doc) => (
        <GlassCard key={doc.id} style={styles.listCard}>
          <View style={styles.listRow}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.listSub, { flex: 1, marginLeft: SPACING.sm }]} numberOfLines={1}>{doc.name}</Text>
            <Text style={[styles.docStatus, doc.status === 'verified' && { color: COLORS.success }]}>{doc.status}</Text>
          </View>
        </GlassCard>
      ))}
    </>
  );

  const renderBoostSection = (
    key: string,
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    done: boolean,
    content: React.ReactNode
  ) => (
    <GlassCard style={styles.sectionCard}>
      <TouchableOpacity style={styles.sectionCardHeader} onPress={() => setOpenSection(openSection === key ? null : key)}>
        <View style={[styles.sectionIcon, done && styles.sectionIconDone]}>
          <Ionicons name={done ? 'checkmark' : icon} size={18} color={done ? COLORS.success : COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionCardTitle}>{title}</Text>
          <Text style={styles.sectionCardSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name={openSection === key ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textTertiary} />
      </TouchableOpacity>
      {openSection === key && <View style={styles.sectionCardBody}>{content}</View>}
    </GlassCard>
  );

  const renderBoost = () => {
    const hasAreas = profile.serviceAreas.counties.length > 0 || profile.serviceAreas.towns.length > 0;
    const hasHours = profile.open247 || profile.businessHours.filter((d) => !d.closed).length >= 5;
    const hasPackages = profile.packages.length >= 1;
    const hasPayouts = !!profile.mpesaNumber.trim();
    const hasBranding = !!profile.branding.tagline.trim();

    return (
      <>
        <SectionTitle icon="rocket-outline" title="Ranking boost" subtitle="Optional extras that lift your profile strength and search ranking." />
        <GlassCard style={styles.hintCard}>
          <Ionicons name="sparkles-outline" size={16} color={COLORS.primary} />
          <Text style={styles.hintText}>Every section you complete improves your ranking. Certificates and work photos get the biggest boost.</Text>
        </GlassCard>
        {renderBoostSection('areas', 'location-outline', 'Service areas', 'Where do you travel to work?', hasAreas, (
          <>
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
            <View style={styles.radiusCard}>
              <Text style={styles.fieldLabel}>Travel radius</Text>
              <View style={styles.radiusRow}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => updateDraft({ serviceAreas: { ...profile.serviceAreas, radiusKm: Math.max(5, profile.serviceAreas.radiusKm - 5) } })}>
                  <Ionicons name="remove" size={16} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={styles.radiusValue}>{profile.serviceAreas.radiusKm} km</Text>
                  <View style={styles.radiusTrack}>
                    <View style={[styles.radiusFill, { width: `${Math.min(100, profile.serviceAreas.radiusKm)}%` }]} />
                  </View>
                </View>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => updateDraft({ serviceAreas: { ...profile.serviceAreas, radiusKm: Math.min(100, profile.serviceAreas.radiusKm + 5) } })}>
                  <Ionicons name="add" size={16} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        ))}
        {renderBoostSection('hours', 'time-outline', 'Business hours', 'When can customers reach you?', hasHours, (
          <>
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
        ))}
        {renderBoostSection('packages', 'pricetags-outline', 'Packages & pricing', 'Call-out fees and Bronze, Silver & Gold packages.', hasPackages, (
          <>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Call-out fee (KSh)" value={String(profile.callOutFee || '')} onChange={(v) => updateDraft({ callOutFee: parseFloat(v) || 0 })} keyboardType="numeric" placeholder="500" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Consultation (KSh)" value={String(profile.consultationFee || '')} onChange={(v) => updateDraft({ consultationFee: parseFloat(v) || 0 })} keyboardType="numeric" placeholder="0" />
              </View>
            </View>
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
                    <Field label="Package name" value={pkg.name} onChange={(v) => updateDraft({ packages: profile.packages.map((p) => (p.id === pkg.id ? { ...p, name: v } : p)) })} placeholder="Silver Package" />
                    <Field label="Price (KSh)" value={pkg.price ? String(pkg.price) : ''} onChange={(v) => updateDraft({ packages: profile.packages.map((p) => (p.id === pkg.id ? { ...p, price: parseFloat(v) || 0 } : p)) })} keyboardType="numeric" />
                    <Field label="Description" value={pkg.description} onChange={(v) => updateDraft({ packages: profile.packages.map((p) => (p.id === pkg.id ? { ...p, description: v } : p)) })} multiline />
                    <Field label="Features (comma separated)" value={pkg.features.join(', ')} onChange={(v) => updateDraft({ packages: profile.packages.map((p) => (p.id === pkg.id ? { ...p, features: v.split(',').map((f) => f.trim()).filter(Boolean) } : p)) })} />
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
        ))}
        {renderBoostSection('payouts', 'wallet-outline', 'Payout preferences', 'How do you get paid? Payouts go to M-Pesa or your bank.', hasPayouts, (
          <>
            <Text style={styles.fieldLabel}>Accepted methods</Text>
            <View style={styles.chipWrap}>
              {PAYMENT_METHODS.map((m) => (
                <Chip key={m} label={m} selected={profile.paymentMethods.includes(m)} onPress={() => updateDraft({ paymentMethods: profile.paymentMethods.includes(m) ? profile.paymentMethods.filter((x) => x !== m) : [...profile.paymentMethods, m] })} icon={profile.paymentMethods.includes(m) ? 'checkmark' : undefined} />
              ))}
            </View>
            <View style={{ marginTop: SPACING.md }}>
              <Field label="M-Pesa payout number" value={profile.mpesaNumber} onChange={(v) => updateDraft({ mpesaNumber: v })} placeholder="+254 7XX XXX XXX" keyboardType="phone-pad" icon="phone-portrait-outline" />
            </View>
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
        ))}
        {renderBoostSection('branding', 'color-palette-outline', 'Branding & languages', 'Accent colour, tagline, languages and promo video.', hasBranding, (
          <>
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
        ))}
      </>
    );
  };

  const renderReview = () => (
    <>
      <SectionTitle icon="checkmark-done-outline" title="Review & publish" subtitle="Everything looks great. Here's what clients will see." />
      <LinearGradient colors={COLORS.gradientCard} style={styles.scoreCard}>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreValue}>{strength.score}%</Text>
          <Text style={styles.scoreLabel}>strength</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.scoreTitle}>{strength.label}</Text>
          <Text style={styles.scoreSub}>{strength.hints[0] || 'Your profile is ready to go live.'}</Text>
        </View>
      </LinearGradient>

      {[
        { index: 0, icon: 'person-circle-outline', title: 'Basic information', done: completion.sections[0].done >= completion.sections[0].total, sub: profile.businessName || 'Not set' },
        { index: 1, icon: 'construct-outline', title: 'Service information', done: completion.sections[1].done >= completion.sections[1].total, sub: `${profile.category} · ${profile.services.length} service${profile.services.length === 1 ? '' : 's'}` },
        { index: 2, icon: 'images-outline', title: 'Portfolio & experience', done: completion.sections[2].done >= completion.sections[2].total, sub: `${profile.portfolio.length} photo${profile.portfolio.length === 1 ? '' : 's'} · ${profile.certifications.length} certification${profile.certifications.length === 1 ? '' : 's'}` },
        { index: 3, icon: 'rocket-outline', title: 'Ranking boost', done: completion.sections[3].done >= completion.sections[3].total, sub: completion.sections[3].done > 0 ? `${completion.sections[3].done}/${completion.sections[3].total} completed` : 'Add optional extras to rank higher' },
      ].map((card) => (
        <TouchableOpacity key={card.index} style={styles.summaryCard} onPress={() => { setCurrentIndex(card.index); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
          <View style={[styles.sectionIcon, card.done && styles.sectionIconDone]}>
            <Ionicons name={card.done ? 'checkmark' : (card.icon as keyof typeof Ionicons.glyphMap)} size={18} color={card.done ? COLORS.success : COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>{card.title}</Text>
            <Text style={styles.summarySub}>{card.sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      ))}

      <GlassCard style={styles.planCard}>
        <Ionicons name="sparkles" size={18} color={COLORS.primary} />
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.listTitle}>Free to join — your profile goes live immediately</Text>
          <Text style={styles.listSub}>
            No approval queue. Upgrade to a plan anytime to unlock leads, booking tools and premium search placement.
          </Text>
        </View>
      </GlassCard>

      <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Auto-generated search keywords</Text>
      <View style={styles.chipWrap}>
        {keywords.slice(0, 12).map((k) => (
          <Chip key={k} label={k} selected onPress={() => {}} />
        ))}
      </View>
      <GlassCard style={{ ...styles.hintCard, marginTop: SPACING.md }}>
        <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
        <Text style={styles.hintText}>Profiles go live immediately after onboarding so clients can discover you right away.</Text>
      </GlassCard>
    </>
  );

  // ================= SUCCESS STATE =================

  if (published) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={COLORS.gradientNight} style={styles.bg} />
        <View style={styles.successWrap}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={44} color="#000" />
          </View>
          <Text style={styles.successTitle}>Your profile is live!</Text>
          <Text style={styles.successSub}>
            Clients can now find {profile.businessName} in HAMA search. You're officially open for business.
          </Text>
          <GlassCard style={styles.successCard}>
            <View style={styles.successRow}>
              <Ionicons name="search-outline" size={18} color={COLORS.primary} />
              <Text style={styles.successRowText}>You're findable in search by category, area and keywords.</Text>
            </View>
            <View style={styles.successRow}>
              <Ionicons name="create-outline" size={18} color={COLORS.primary} />
              <Text style={styles.successRowText}>Update your profile, photos and pricing anytime from the dashboard.</Text>
            </View>
            <View style={styles.successRow}>
              <Ionicons name="diamond-outline" size={18} color={COLORS.primary} />
              <Text style={styles.successRowText}>Upgrade to a plan anytime to unlock leads, booking tools and premium placement.</Text>
            </View>
          </GlassCard>
          <TouchableOpacity style={styles.successCta} onPress={() => navigation.replace('SellerDashboard')}>
            <Ionicons name="analytics" size={18} color="#000" />
            <Text style={styles.successCtaText}>Open Seller Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.successSecondary} onPress={() => navigation.replace('/(tabs)')}>
            <Text style={styles.successSecondaryText}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderStep = () => {
    if (isReview) return renderReview();
    switch (step) {
      case 'basic': return renderBasic();
      case 'service': return renderService();
      case 'portfolio': return renderPortfolio();
      case 'boost': return renderBoost();
    }
  };

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
            <View style={styles.dotsRow}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive, i < currentIndex && styles.dotDone]} />
              ))}
            </View>
            <Text style={styles.headerSub}>{isReview ? 'Review & publish' : PROVIDER_STEP_LABELS[step]}</Text>
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
              onPress={isReview ? handlePublish : goNext}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color="#000" />
              ) : isReview ? (
                <>
                  <Ionicons name="rocket" size={18} color="#000" />
                  <Text style={styles.footerPrimaryText}>Publish My Profile Now</Text>
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
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.13)' },
  dotActive: { backgroundColor: COLORS.primary, width: 18 },
  dotDone: { backgroundColor: COLORS.success },
  resumeBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginHorizontal: SPACING.md, marginBottom: SPACING.sm, padding: SPACING.sm + 2, borderRadius: RADIUS.md, backgroundColor: 'rgba(0,212,170,0.08)', borderWidth: 1, borderColor: 'rgba(0,212,170,0.25)' },
  resumeText: { ...FONTS.caption, color: COLORS.success, flex: 1 },
  field: { marginBottom: SPACING.md },
  fieldLabel: { ...FONTS.caption, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '600' },
  optionalText: { color: COLORS.textTertiary, fontWeight: '400' },
  helperText: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 4, marginBottom: SPACING.sm, lineHeight: 16 },
  inlineError: { ...FONTS.caption, color: COLORS.error, marginTop: -SPACING.sm, marginBottom: SPACING.sm },
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
  sectionIconDone: { backgroundColor: 'rgba(0,212,170,0.12)' },
  sectionTitle: { ...FONTS.h3 },
  sectionSubtitle: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg },
  photoPicker: { width: 108, height: 108, borderRadius: RADIUS.xl, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: SPACING.sm },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoChangeBadge: { position: 'absolute', bottom: 8, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  photoChangeText: { ...FONTS.caption, color: '#000', fontWeight: '700' },
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
  sectionCard: { marginBottom: SPACING.md, padding: SPACING.md },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  sectionCardTitle: { ...FONTS.bodyLarge, fontSize: 15 },
  sectionCardSubtitle: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 2 },
  sectionCardBody: { marginTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  portfolioItem: { width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * 2) / 3, aspectRatio: 1, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: COLORS.bgCard },
  portfolioImage: { width: '100%', height: '100%' },
  portfolioRemove: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: RADIUS.full, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
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
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  summaryTitle: { ...FONTS.bodyLarge, fontSize: 15 },
  summarySub: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 2 },
  planCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, marginTop: SPACING.md },
  errorToast: { position: 'absolute', bottom: 140, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(255,77,106,0.12)', borderWidth: 1, borderColor: 'rgba(255,77,106,0.35)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  errorText: { ...FONTS.caption, color: COLORS.error },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  footerRow: { flexDirection: 'row', gap: SPACING.md },
  footerSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, paddingVertical: 16, borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  footerSecondaryText: { ...FONTS.button, color: COLORS.textSecondary, fontSize: 15 },
  footerPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, flex: 2.2, paddingVertical: 16, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, ...SHADOWS.md },
  footerPrimaryMuted: { opacity: 0.6 },
  footerPrimaryText: { ...FONTS.button, color: '#000', fontSize: 15 },
  successWrap: { flex: 1, padding: SPACING.lg, justifyContent: 'center' },
  successCircle: { width: 96, height: 96, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: SPACING.lg },
  successTitle: { ...FONTS.h1, textAlign: 'center' },
  successSub: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 22 },
  successCard: { marginTop: SPACING.lg, padding: SPACING.md, gap: SPACING.md },
  successRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  successRowText: { ...FONTS.bodySmall, color: COLORS.textSecondary, flex: 1, lineHeight: 19 },
  successCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.xl, paddingVertical: 16, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, ...SHADOWS.md },
  successCtaText: { ...FONTS.button, color: '#000', fontSize: 15 },
  successSecondary: { alignItems: 'center', paddingVertical: 14, marginTop: SPACING.sm },
  successSecondaryText: { ...FONTS.button, color: COLORS.textSecondary, fontSize: 15 },
});
