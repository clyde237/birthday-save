import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';
import { PermissionReport } from '../types';

interface PermissionCardProps {
  permission: PermissionReport | null;
  onRequestPermission: () => void;
  onSendImmediateTest: () => void;
}

export const PermissionCard: React.FC<PermissionCardProps> = ({
  permission,
  onRequestPermission,
  onSendImmediateTest,
}) => {
  const isGranted = permission?.granted ?? false;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>État des autorisations Android</Text>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isGranted ? THEME.colors.successBg : THEME.colors.warningBg },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: isGranted ? THEME.colors.success : THEME.colors.warning },
            ]}
          >
            {isGranted ? '✓ Autorisées' : '⚠ Non accordées'}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>
        {isGranted
          ? 'Le canal "Rappels d’anniversaire" est configuré avec priorité maximale et alertes déverrouillées.'
          : 'Les notifications sont requises pour que Birthday-save vous alerte même lorsque le téléphone est en veille.'}
      </Text>

      <View style={styles.buttonRow}>
        {!isGranted ? (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onRequestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>🔔 Accorder la permission</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onSendImmediateTest}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>⚡ Tester le son & la bannière</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.round,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: THEME.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  secondaryButtonText: {
    color: THEME.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
