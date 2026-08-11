/**
 * MessageContextMenu
 *
 * Long-press context menu for messages.
 * Shows options: Reply, Edit, Delete, Report based on message ownership.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';

interface MessageContextMenuProps {
  visible: boolean;
  onClose: () => void;
  isOwn: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  visible,
  onClose,
  isOwn,
  onReply,
  onEdit,
  onDelete,
  onReport,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { onReply?.(); onClose(); }}>
            <Ionicons name="arrow-undo-outline" size={20} color={COLORS.text} />
            <Text style={styles.menuText}>Reply</Text>
          </TouchableOpacity>

          {isOwn && (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => { onEdit?.(); onClose(); }}>
                <Ionicons name="pencil-outline" size={20} color={COLORS.text} />
                <Text style={styles.menuText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { onDelete?.(); onClose(); }}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                <Text style={[styles.menuText, styles.menuTextDanger]}>Delete</Text>
              </TouchableOpacity>
            </>
          )}

          {!isOwn && (
            <TouchableOpacity style={styles.menuItem} onPress={() => { onReport?.(); onClose(); }}>
              <Ionicons name="flag-outline" size={20} color={COLORS.warning} />
              <Text style={[styles.menuText, { color: COLORS.warning }]}>Report</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    minWidth: 180,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  menuText: {
    ...FONTS.body,
    color: COLORS.text,
  },
  menuTextDanger: {
    color: COLORS.error,
  },
});
