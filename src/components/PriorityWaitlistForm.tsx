/**
 * HAMA™ Priority Subscriber Waitlist Form
 *
 * A modal form that allows users to join the priority subscriber waitlist.
 * Captures name, email, phone, preferred plan, and business size.
 * Tags entries by intent level (High/Medium/Low) based on plan selection.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { EARLY_ACCESS_CONFIG } from '../config/earlyAccess';
import { trackWaitlistViewed, trackWaitlistSubmitted, trackWaitlistCancelled } from '../utils/analytics';
import type { PreferredPlan } from '../constants/types';

const PLAN_OPTIONS: { key: PreferredPlan; label: string; price: string }[] = [
  { key: 'Free', label: 'Free', price: 'Free' },
  { key: 'Premium', label: 'Premium', price: 'From KSh 299/mo' },
  { key: 'Pro', label: 'Pro', price: 'From KSh 699/mo' },
  { key: 'Enterprise', label: 'Enterprise', price: 'Custom pricing' },
  { key: 'Undecided', label: 'Not Sure Yet', price: '' },
];

export const PriorityWaitlistForm: React.FC = () => {
  const { isWaitlistVisible, hideWaitlist, submitWaitlist } = useEarlyAccess();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PreferredPlan>('Undecided');
  const [businessSize, setBusinessSize] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'plans' | 'form' | 'success'>('plans');

  if (!isWaitlistVisible || !EARLY_ACCESS_CONFIG.WAITLIST.ENABLED) return null;

  const handlePlanSelect = (plan: PreferredPlan) => {
    setSelectedPlan(plan);
    setStep('form');
    trackWaitlistViewed();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Required', 'Please enter your name and email.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await submitWaitlist({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        preferredPlan: selectedPlan,
        businessSize: businessSize.trim() || undefined,
      });
      trackWaitlistSubmitted(selectedPlan);
      setStep('success');
    } catch {
      Alert.alert('Error', 'Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    trackWaitlistCancelled();
    setStep('plans');
    setName('');
    setEmail('');
    setPhone('');
    setSelectedPlan('Undecided');
    setBusinessSize('');
    hideWaitlist();
  };

  const handleSuccessDone = () => {
    setStep('plans');
    setName('');
    setEmail('');
    setPhone('');
    setSelectedPlan('Undecided');
    setBusinessSize('');
    hideWaitlist();
  };

  return (
    <Modal
      visible={isWaitlistVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.container}>
          <LinearGradient
            colors={['rgba(10, 10, 10, 0.99)', 'rgba(0, 0, 0, 0.99)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modal}
          >
            {/* Close */}
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {/* Step: Success */}
              {step === 'success' && (
                <View style={styles.successContainer}>
                  <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={40} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.successTitle}>You're on the List!</Text>
                  <Text style={styles.successDesc}>
                    You'll be among the first to know when HAMA subscriptions launch. As a priority
                    subscriber, you'll receive exclusive early access pricing and updates.
                  </Text>
                  <Text style={styles.successPlan}>
                    Preferred Plan: <Text style={styles.successPlanHighlight}>{selectedPlan}</Text>
                  </Text>
                  <TouchableOpacity style={styles.successButton} onPress={handleSuccessDone}>
                    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.successButtonGrad}>
                      <Text style={styles.successButtonText}>Done</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step: Plan Selection */}
              {step === 'plans' && (
                <>
                  <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
                    <Ionicons name="notifications" size={28} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.title}>Priority Access List</Text>
                  <Text style={styles.subtitle}>
                    Be the first to know when subscriptions launch. Choose your preferred plan and
                    we'll notify you with exclusive early pricing.
                  </Text>
                  <View style={styles.plansGrid}>
                    {PLAN_OPTIONS.map((plan) => (
                      <TouchableOpacity
                        key={plan.key}
                        style={styles.planCard}
                        onPress={() => handlePlanSelect(plan.key)}
                      >
                        <LinearGradient
                          colors={['rgba(255, 107, 0, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.planCardGradient}
                        >
                          <Ionicons
                            name={plan.key === 'Free' ? 'happy-outline' : plan.key === 'Premium' ? 'diamond-outline' : plan.key === 'Pro' ? 'rocket-outline' : plan.key === 'Enterprise' ? 'business-outline' : 'help-outline'}
                            size={24}
                            color={COLORS.primary}
                          />
                          <Text style={styles.planName}>{plan.label}</Text>
                          {plan.price ? <Text style={styles.planPrice}>{plan.price}</Text> : null}
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Step: Form */}
              {step === 'form' && (
                <>
                  <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
                    <Ionicons name="create-outline" size={28} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.title}>Join the {selectedPlan} Waitlist</Text>
                  <Text style={styles.subtitle}>
                    Enter your details to secure your priority spot.
                  </Text>

                  <View style={styles.form}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Name *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Your full name"
                        placeholderTextColor={COLORS.textTertiary}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor={COLORS.textTertiary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Phone (optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="+254 712 345 678"
                        placeholderTextColor={COLORS.textTertiary}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Business Size (optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 1-10 employees"
                        placeholderTextColor={COLORS.textTertiary}
                        value={businessSize}
                        onChangeText={setBusinessSize}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                      onPress={handleSubmit}
                      disabled={submitting}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitBtnGrad}
                      >
                        {submitting ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <Text style={styles.submitBtnText}>Join Priority List</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.backBtn} onPress={() => setStep('plans')}>
                    <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.backBtnText}>Choose a different plan</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  modal: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: 12, right: 12,
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scroll: {
    padding: SPACING.xl,
    gap: 16,
  },
  iconCircle: {
    width: 56, height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    ...SHADOWS.glow,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Plans Grid
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  planCard: {
    width: '47%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  planCardGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    gap: 6,
  },
  planName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  planPrice: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  // Form
  form: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  submitBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  // Success
  successContainer: {
    alignItems: 'center',
    gap: 16,
  },
  successIcon: {
    width: 72, height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  successTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    textAlign: 'center',
  },
  successDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  successPlan: {
    color: COLORS.textTertiary,
    fontSize: 13,
  },
  successPlanHighlight: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  successButton: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  successButtonGrad: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
