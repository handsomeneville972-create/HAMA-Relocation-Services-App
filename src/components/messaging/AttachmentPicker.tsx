/**
 * AttachmentPicker
 *
 * Bottom sheet for selecting image/file attachments.
 * Uses expo-image-picker for camera/gallery selection.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';

interface AttachmentPickerProps {
  visible: boolean;
  onClose: () => void;
  onPickImage: (uri: string, fileName: string) => void;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  visible,
  onClose,
  onPickImage,
}) => {
  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onPickImage(asset.uri, asset.fileName || 'image.jpg');
      onClose();
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onPickImage(asset.uri, asset.fileName || 'photo.jpg');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Attach File</Text>

          <TouchableOpacity style={styles.option} onPress={takePhoto}>
            <View style={styles.iconCircle}>
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.optionText}>Take Photo</Text>
              <Text style={styles.optionSubtext}>Use your camera</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={pickFromGallery}>
            <View style={styles.iconCircle}>
              <Ionicons name="images-outline" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.optionText}>Choose from Gallery</Text>
              <Text style={styles.optionSubtext}>Select an existing photo</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bgElevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.glassBorder,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,107,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    ...FONTS.body,
    color: COLORS.text,
  },
  optionSubtext: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  cancelButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelText: {
    ...FONTS.body,
    color: COLORS.textTertiary,
  },
});
