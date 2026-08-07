import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, Dimensions, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlass } from '../components/LiquidGlass';
import { GlassCard } from '../components/GlassCard';
import { LandlordUploadSuccessPopup } from '../components/LandlordUploadSuccessPopup';
import { LandlordSubscriptionModal } from '../components/LandlordSubscriptionModal';
import { loadLandlordUploads, incrementPropertyCount, getLandlordUploadState } from '../utils/landlordUploads';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

type OnboardingStep =
  | 'personal'
  | 'identity'
  | 'business'
  | 'payout'
  | 'property'
  | 'review';

interface PropertyDraft {
  title: string;
  description: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  location: string;
  amenities: string[];
  furnished: boolean;
  available: boolean;
  constructionStatus: 'ready' | 'under_construction' | 'pre_construction';
  latitude: string;
  longitude: string;
}

interface LandlordProfile {
  fullName: string;
  email: string;
  phone: string;
  idType: 'national_id' | 'passport';
  idNumber: string;
  businessName: string;
  businessRegNumber: string;
  taxId: string;
  payoutMethod: 'mpesa' | 'bank' | 'paypal';
  payoutDetails: string;
  accountName: string;
}

const STEPS: { key: OnboardingStep; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'personal', label: 'Personal', icon: 'person-outline' },
  { key: 'identity', label: 'Identity', icon: 'shield-checkmark-outline' },
  { key: 'business', label: 'Business', icon: 'business-outline' },
  { key: 'payout', label: 'Payout', icon: 'card-outline' },
  { key: 'property', label: 'Property', icon: 'home-outline' },
  { key: 'review', label: 'Review', icon: 'checkmark-circle-outline' },
];

const AMENITIES_OPTIONS = [
  'WiFi', 'Parking', 'Security', 'Water', 'Electricity',
  'Gym', 'Pool', 'Elevator', 'Garden', 'Balcony',
  'AC', 'Furnished', 'Pet Friendly', 'Generator',
];

const INITIAL_PROFILE: LandlordProfile = {
  fullName: '', email: '', phone: '',
  idType: 'national_id', idNumber: '',
  businessName: '', businessRegNumber: '', taxId: '',
  payoutMethod: 'mpesa', payoutDetails: '', accountName: '',
};

const INITIAL_PROPERTY: PropertyDraft = {
  title: '', description: '', price: '',
  bedrooms: '', bathrooms: '', size: '',
  location: '', amenities: [], furnished: false,
  available: true, constructionStatus: 'ready',
  latitude: '', longitude: '',
};

export const LandlordOnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('personal');
  const [profile, setProfile] = useState<LandlordProfile>(INITIAL_PROFILE);
  const [properties, setProperties] = useState<PropertyDraft[]>([{ ...INITIAL_PROPERTY }]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    loadLandlordUploads();
  }, []);

  const stepIndex = STEPS.findIndex(s => s.key === currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === 'review';

  const updateProfile = useCallback((key: keyof LandlordProfile, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateProperty = useCallback((index: number, key: keyof PropertyDraft, value: any) => {
    setProperties(prev => prev.map((p, i) => i === index ? { ...p, [key]: value } : p));
  }, []);

  const toggleAmenity = useCallback((amenity: string) => {
    setProperties(prev => prev.map((p, i) => ({
      ...p,
      amenities: p.amenities.includes(amenity)
        ? p.amenities.filter(a => a !== amenity)
        : [...p.amenities, amenity],
    })));
  }, []);

  const addProperty = useCallback(() => {
    setProperties(prev => [...prev, { ...INITIAL_PROPERTY }]);
  }, []);

  const removeProperty = useCallback((index: number) => {
    setProperties(prev => prev.filter((_, i) => i !== index));
  }, []);

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
    const idx = STEPS.findIndex(s => s.key === step);
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
  }, []);

  const goNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      goToStep(STEPS[stepIndex + 1].key);
    }
  }, [stepIndex, goToStep]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      goToStep(STEPS[stepIndex - 1].key);
    } else {
      navigation.goBack();
    }
  }, [stepIndex, goToStep, navigation]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const state = await incrementPropertyCount();
      if (state.propertyCount === 3 && !state.hasExceededFreeLimit) {
        navigation.replace('LandlordDashboard');
        setTimeout(() => setShowUploadSuccess(true), 600);
      } else {
        navigation.replace('LandlordDashboard');
      }
    } catch {
      // error handled silently
    } finally {
      setIsSubmitting(false);
    }
  }, [navigation]);

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{stepIndex + 1} of {STEPS.length}</Text>
    </View>
  );

  const renderStepIndicator = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepsRow} contentContainerStyle={styles.stepsContent}>
      {STEPS.map((step, idx) => {
        const isActive = currentStep === step.key;
        const isCompleted = idx < stepIndex;
        return (
          <TouchableOpacity key={step.key} style={styles.stepItem} onPress={() => goToStep(step.key)}>
            <View style={[styles.stepCircle, isActive && styles.stepCircleActive, isCompleted && styles.stepCircleCompleted]}>
              <Ionicons name={isCompleted ? 'checkmark' : step.icon} size={16} color={isCompleted || isActive ? '#fff' : COLORS.textTertiary} />
            </View>
            <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{step.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderPersonalStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about yourself</Text>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={18} color={COLORS.textTertiary} />
          <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor={COLORS.textTertiary} value={profile.fullName} onChangeText={v => updateProfile('fullName', v)} />
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={18} color={COLORS.textTertiary} />
          <TextInput style={styles.input} placeholder="john@example.com" placeholderTextColor={COLORS.textTertiary} keyboardType="email-address" autoCapitalize="none" value={profile.email} onChangeText={v => updateProfile('email', v)} />
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={18} color={COLORS.textTertiary} />
          <TextInput style={styles.input} placeholder="+254 712 345 678" placeholderTextColor={COLORS.textTertiary} keyboardType="phone-pad" value={profile.phone} onChangeText={v => updateProfile('phone', v)} />
        </View>
      </View>
    </View>
  );

  const renderIdentityStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Identity Verification</Text>
      <Text style={styles.stepSubtitle}>Verify your identity to activate landlord tools</Text>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>ID Type</Text>
        <View style={styles.optionRow}>
          {(['national_id', 'passport'] as const).map(type => (
            <TouchableOpacity key={type} style={[styles.optionCard, profile.idType === type && styles.optionCardActive]} onPress={() => updateProfile('idType', type)}>
              <Ionicons name={type === 'national_id' ? 'id-card-outline' : 'airplane-outline'} size={24} color={profile.idType === type ? COLORS.primary : COLORS.textTertiary} />
              <Text style={[styles.optionLabel, profile.idType === type && styles.optionLabelActive]}>{type === 'national_id' ? 'National ID' : 'Passport'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>ID Number</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="document-text-outline" size={18} color={COLORS.textTertiary} />
          <TextInput style={styles.input} placeholder="Enter ID number" placeholderTextColor={COLORS.textTertiary} value={profile.idNumber} onChangeText={v => updateProfile('idNumber', v)} />
        </View>
      </View>
      <LiquidGlass variant="subtle" style={styles.uploadCard}>
        <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
        <Text style={styles.uploadTitle}>Upload ID Photo</Text>
        <Text style={styles.uploadHint}>Front and back of your ID or passport</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload Photos</Text>
        </TouchableOpacity>
      </LiquidGlass>
      <LiquidGlass variant="subtle" style={styles.uploadCard}>
        <Ionicons name="camera-reverse-outline" size={32} color={COLORS.primary} />
        <Text style={styles.uploadTitle}>Selfie Verification</Text>
        <Text style={styles.uploadHint}>Take a selfie to confirm your identity</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Take Selfie</Text>
        </TouchableOpacity>
      </LiquidGlass>
    </View>
  );

  const renderBusinessStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Business Information</Text>
      <Text style={styles.stepSubtitle}>Set up your landlord business profile</Text>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Business Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="business-outline" size={18} color={COLORS.textTertiary} />
          <TextInput style={styles.input} placeholder="Your business name" placeholderTextColor={COLORS.textTertiary} value={profile.businessName} onChangeText={v => updateProfile('businessName', v)} />
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Business Registration Number</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="document-text-outline" size={18} color={COLORS.textTertiary} />
          <TextInput style={styles.input} placeholder="Optional" placeholderTextColor={COLORS.textTertiary} value={profile.businessRegNumber} onChangeText={v => updateProfile('businessRegNumber', v)} />
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Tax ID (KRA PIN)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="receipt-outline" size={18} color={COLORS.textTertiary} />
          <TextInput style={styles.input} placeholder="Optional" placeholderTextColor={COLORS.textTertiary} value={profile.taxId} onChangeText={v => updateProfile('taxId', v)} />
        </View>
      </View>
    </View>
  );

  const renderPayoutStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payout Details</Text>
      <Text style={styles.stepSubtitle}>How would you like to receive payments?</Text>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Payout Method</Text>
        <View style={styles.optionRow}>
          {(['mpesa', 'bank', 'paypal'] as const).map(method => (
            <TouchableOpacity key={method} style={[styles.optionCard, profile.payoutMethod === method && styles.optionCardActive]} onPress={() => updateProfile('payoutMethod', method)}>
              <Ionicons name={method === 'mpesa' ? 'phone-portrait-outline' : method === 'bank' ? 'business-outline' : 'globe-outline'} size={24} color={profile.payoutMethod === method ? COLORS.primary : COLORS.textTertiary} />
              <Text style={[styles.optionLabel, profile.payoutMethod === method && styles.optionLabelActive]}>{method.charAt(0).toUpperCase() + method.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>{profile.payoutMethod === 'mpesa' ? 'M-Pesa Number' : profile.payoutMethod === 'bank' ? 'Account Number' : 'PayPal Email'}</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="card-outline" size={18} color={COLORS.textTertiary} />
          <TextInput style={styles.input} placeholder="Enter payout details" placeholderTextColor={COLORS.textTertiary} value={profile.payoutDetails} onChangeText={v => updateProfile('payoutDetails', v)} />
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Account Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={18} color={COLORS.textTertiary} />
          <TextInput style={styles.input} placeholder="Full account name" placeholderTextColor={COLORS.textTertiary} value={profile.accountName} onChangeText={v => updateProfile('accountName', v)} />
        </View>
      </View>
    </View>
  );

  const renderPropertyStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Property Management</Text>
      <Text style={styles.stepSubtitle}>Add your properties for listing</Text>
      {properties.map((property, index) => (
        <LiquidGlass key={index} variant="elevated" style={styles.propertyCard}>
          <View style={styles.propertyCardHeader}>
            <Text style={styles.propertyCardTitle}>Property {index + 1}</Text>
            {properties.length > 1 && (
              <TouchableOpacity onPress={() => removeProperty(index)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput style={styles.smallInput} placeholder="e.g. 2BR in Kilimani" placeholderTextColor={COLORS.textTertiary} value={property.title} onChangeText={v => updateProperty(index, 'title', v)} />
          </View>
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Bedrooms</Text>
              <TextInput style={styles.smallInput} placeholder="2" placeholderTextColor={COLORS.textTertiary} keyboardType="number-pad" value={property.bedrooms} onChangeText={v => updateProperty(index, 'bedrooms', v)} />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Bathrooms</Text>
              <TextInput style={styles.smallInput} placeholder="2" placeholderTextColor={COLORS.textTertiary} keyboardType="number-pad" value={property.bathrooms} onChangeText={v => updateProperty(index, 'bathrooms', v)} />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Size (sqm)</Text>
              <TextInput style={styles.smallInput} placeholder="85" placeholderTextColor={COLORS.textTertiary} keyboardType="number-pad" value={property.size} onChangeText={v => updateProperty(index, 'size', v)} />
            </View>
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Monthly Rent (KSh)</Text>
            <TextInput style={styles.smallInput} placeholder="e.g. 50000" placeholderTextColor={COLORS.textTertiary} keyboardType="number-pad" value={property.price} onChangeText={v => updateProperty(index, 'price', v)} />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput style={styles.smallInput} placeholder="e.g. Kilimani, Nairobi" placeholderTextColor={COLORS.textTertiary} value={property.location} onChangeText={v => updateProperty(index, 'location', v)} />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>GPS Coordinates</Text>
            <View style={styles.formRow}>
              <TextInput style={[styles.smallInput, { flex: 1 }]} placeholder="Latitude" placeholderTextColor={COLORS.textTertiary} value={property.latitude} onChangeText={v => updateProperty(index, 'latitude', v)} />
              <TextInput style={[styles.smallInput, { flex: 1 }]} placeholder="Longitude" placeholderTextColor={COLORS.textTertiary} value={property.longitude} onChangeText={v => updateProperty(index, 'longitude', v)} />
            </View>
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Construction Status</Text>
            <View style={styles.optionRow}>
              {(['ready', 'under_construction', 'pre_construction'] as const).map(status => (
                <TouchableOpacity key={status} style={[styles.smallOption, property.constructionStatus === status && styles.smallOptionActive]} onPress={() => updateProperty(index, 'constructionStatus', status)}>
                  <Text style={[styles.smallOptionText, property.constructionStatus === status && styles.smallOptionTextActive]}>
                    {status === 'ready' ? 'Ready' : status === 'under_construction' ? 'Under Construction' : 'Pre-Construction'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <LiquidGlass variant="subtle" style={styles.uploadCard}>
            <Ionicons name="images-outline" size={24} color={COLORS.primary} />
            <Text style={styles.uploadTitle}>Property Photos & Videos</Text>
            <Text style={styles.uploadHint}>Upload up to 10 photos and 1 video walkthrough</Text>
            <TouchableOpacity style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Upload Media</Text>
            </TouchableOpacity>
          </LiquidGlass>
          <LiquidGlass variant="subtle" style={styles.uploadCard}>
            <Ionicons name="map-outline" size={24} color={COLORS.primary} />
            <Text style={styles.uploadTitle}>Floor Plan</Text>
            <Text style={styles.uploadHint}>Upload floor plan image (optional)</Text>
            <TouchableOpacity style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Upload Floor Plan</Text>
            </TouchableOpacity>
          </LiquidGlass>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Amenities</Text>
            <View style={styles.amenitiesRow}>
              {AMENITIES_OPTIONS.map(amenity => (
                <TouchableOpacity key={amenity} style={[styles.amenityChip, property.amenities.includes(amenity) && styles.amenityChipActive]} onPress={() => toggleAmenity(amenity)}>
                  <Text style={[styles.amenityChipText, property.amenities.includes(amenity) && styles.amenityChipTextActive]}>{amenity}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleButton, property.furnished && styles.toggleButtonActive]} onPress={() => updateProperty(index, 'furnished', !property.furnished)}>
              <Ionicons name={property.furnished ? 'bed' : 'bed-outline'} size={18} color={property.furnished ? COLORS.primary : COLORS.textTertiary} />
              <Text style={[styles.toggleText, property.furnished && styles.toggleTextActive]}>Furnished</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleButton, property.available && styles.toggleButtonActive]} onPress={() => updateProperty(index, 'available', !property.available)}>
              <Ionicons name={property.available ? 'checkmark-circle' : 'close-circle-outline'} size={18} color={property.available ? COLORS.success : COLORS.textTertiary} />
              <Text style={[styles.toggleText, property.available && styles.toggleTextActive]}>{property.available ? 'Available' : 'Rented'}</Text>
            </TouchableOpacity>
          </View>
        </LiquidGlass>
      ))}
      <TouchableOpacity style={styles.addPropertyButton} onPress={addProperty}>
        <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
        <Text style={styles.addPropertyText}>Add Another Property</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepSubtitle}>Review your information before submitting</Text>
      <LiquidGlass variant="elevated" style={styles.reviewCard}>
        <Text style={styles.reviewSectionTitle}>Personal</Text>
        <Text style={styles.reviewText}>Name: {profile.fullName || 'Not set'}</Text>
        <Text style={styles.reviewText}>Email: {profile.email || 'Not set'}</Text>
        <Text style={styles.reviewText}>Phone: {profile.phone || 'Not set'}</Text>
      </LiquidGlass>
      <LiquidGlass variant="elevated" style={styles.reviewCard}>
        <Text style={styles.reviewSectionTitle}>Identity</Text>
        <Text style={styles.reviewText}>ID Type: {profile.idType === 'national_id' ? 'National ID' : 'Passport'}</Text>
        <Text style={styles.reviewText}>ID Number: {profile.idNumber || 'Not set'}</Text>
      </LiquidGlass>
      <LiquidGlass variant="elevated" style={styles.reviewCard}>
        <Text style={styles.reviewSectionTitle}>Business & Payout</Text>
        <Text style={styles.reviewText}>Business: {profile.businessName || 'Not set'}</Text>
        <Text style={styles.reviewText}>Payout: {profile.payoutMethod} - {profile.payoutDetails || 'Not set'}</Text>
      </LiquidGlass>
      <LiquidGlass variant="elevated" style={styles.reviewCard}>
        <Text style={styles.reviewSectionTitle}>Properties ({properties.length})</Text>
        {properties.map((p, i) => (
          <Text key={i} style={styles.reviewText}>{i + 1}. {p.title || 'Untitled'} - {p.price ? `KSh ${p.price}/mo` : 'No price'} - {p.location || 'No location'}</Text>
        ))}
      </LiquidGlass>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'personal': return renderPersonalStep();
      case 'identity': return renderIdentityStep();
      case 'business': return renderBusinessStep();
      case 'payout': return renderPayoutStep();
      case 'property': return renderPropertyStep();
      case 'review': return renderReviewStep();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0A0A0F']} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Landlord Setup</Text>
          <View style={styles.headerSpacer} />
        </View>
        {renderProgressBar()}
        {renderStepIndicator()}
      </LinearGradient>
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={styles.bodyContent}>
        {renderStep()}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={[styles.nextButton, isLastStep && styles.submitButton]} onPress={isLastStep ? handleSubmit : goNext} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>{isLastStep ? 'Submit & Go to Dashboard' : 'Continue'}</Text>
          )}
          {!isLastStep && !isSubmitting && <Ionicons name="arrow-forward" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      {/* Upload Success Popup */}
      <LandlordUploadSuccessPopup
        visible={showUploadSuccess}
        onPay={() => {
          setShowUploadSuccess(false);
          setShowSubscriptionModal(true);
        }}
        onMaybeLater={() => setShowUploadSuccess(false)}
      />

      {/* Subscription Modal */}
      <LandlordSubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingBottom: SPACING.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...FONTS.h3, color: COLORS.text },
  headerSpacer: { width: 40 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, gap: SPACING.md, marginBottom: SPACING.sm },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  progressText: { color: COLORS.textTertiary, fontSize: 12, fontWeight: '600' },
  stepsRow: { paddingLeft: SPACING.lg },
  stepsContent: { gap: SPACING.md, paddingRight: SPACING.lg },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  stepCircleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepCircleCompleted: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  stepLabel: { fontSize: 10, color: COLORS.textTertiary, fontWeight: '500' },
  stepLabelActive: { color: COLORS.primary },
  body: { flex: 1 },
  bodyContent: { padding: SPACING.lg, paddingBottom: 100 },
  stepContent: { gap: SPACING.lg },
  stepTitle: { ...FONTS.h2, color: COLORS.text },
  stepSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: -SPACING.sm },
  formGroup: { gap: 6 },
  inputLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: COLORS.glassBorder },
  input: { flex: 1, color: COLORS.text, fontSize: 15 },
  smallInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: COLORS.glassBorder },
  formRow: { flexDirection: 'row', gap: SPACING.md },
  optionRow: { flexDirection: 'row', gap: SPACING.md },
  optionCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.glassBorder },
  optionCardActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(255,107,0,0.08)' },
  optionLabel: { color: COLORS.textTertiary, fontSize: 13, fontWeight: '600' },
  optionLabelActive: { color: COLORS.primary },
  smallOption: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  smallOptionActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(255,107,0,0.08)' },
  smallOptionText: { color: COLORS.textTertiary, fontSize: 11, fontWeight: '500' },
  smallOptionTextActive: { color: COLORS.primary },
  uploadCard: { borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', gap: 8, marginTop: SPACING.sm },
  uploadTitle: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  uploadHint: { color: COLORS.textTertiary, fontSize: 12, textAlign: 'center' },
  uploadButton: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 20, borderRadius: RADIUS.full, marginTop: 4 },
  uploadButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  propertyCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  propertyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  propertyCardTitle: { ...FONTS.bodyLarge, color: COLORS.text, fontWeight: '700' },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.glassBorder },
  amenityChipActive: { backgroundColor: 'rgba(255,107,0,0.15)', borderColor: COLORS.primary },
  amenityChipText: { color: COLORS.textTertiary, fontSize: 12, fontWeight: '500' },
  amenityChipTextActive: { color: COLORS.primary },
  toggleRow: { flexDirection: 'row', gap: SPACING.md },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.glassBorder },
  toggleButtonActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(255,107,0,0.08)' },
  toggleText: { color: COLORS.textTertiary, fontSize: 13, fontWeight: '500' },
  toggleTextActive: { color: COLORS.primary },
  addPropertyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed' },
  addPropertyText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  reviewCard: { borderRadius: RADIUS.md, padding: SPACING.lg },
  reviewSectionTitle: { ...FONTS.bodyLarge, color: COLORS.primary, fontWeight: '700', marginBottom: 8 },
  reviewText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  footer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.full },
  submitButton: { backgroundColor: COLORS.success },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
