/**
 * ReportModal
 *
 * Modal for reporting a message or user.
 * Provides category selection and description input.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONTS, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { reportMessage } from '../../services/conversationService';
import type { ReportCategory } from '../../constants/types';

const CATEGORIES: { value: ReportCategory; label: string; icon: string }[] = [
  { value: 'spam', label: 'Spam', icon: 'chatbubble-ellipses-outline' },
  { value: 'harassment', label: 'Harassment', icon: 'warning-outline' },
  { value: 'scam', label: 'Scam', icon: 'skull-outline' },
  { value: 'inappropriate', label: 'Inappropriate', icon: 'eye-off-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reporterId: string;
  reportedUserId: string;
  messageId?: string;
  conversationId?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  reporterId,
  reportedUserId,
  messageId,
  conversationId,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Select a category', 'Please choose a reason for reporting.');
      return;
    }

    setSubmitting(true);
    const { error } = await reportMessage({
      reporterId,
      reportedUserId,
      messageId,
      conversationId,
      category: selectedCategory,
      description: description.trim() || undefined,
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } else {
      Alert.alert('Report Submitted', 'Thank you for helping keep HAMA safe.');
      setSelectedCategory(null);
      setDescription('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Report</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Why are you reporting this?</Text>

          <View style={styles.categories}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.category, selectedCategory === cat.value && styles.categoryActive]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={18}
                  color={selectedCategory === cat.value ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.categoryText, selectedCategory === cat.value && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Additional details (optional)"
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.submitButton, (!selectedCategory || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedCategory || submitting}
          >
            <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modal: {
    backgroundColor: colors.bgElevated,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.h3,
    color: colors.text,
  },
  subtitle: {
    ...FONTS.body,
    color: colors.textSecondary,
    marginBottom: SPACING.md,
  },
  categories: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  categoryActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,107,0,0.08)',
  },
  categoryText: {
    ...FONTS.body,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: SPACING.sm + 4,
    color: colors.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...FONTS.button,
    color: '#fff',
  },
});
