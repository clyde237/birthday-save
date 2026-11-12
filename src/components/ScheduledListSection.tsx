import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';
import { ScheduledNotificationInfo } from '../types';

interface ScheduledListSectionProps {
  notifications: ScheduledNotificationInfo[];
  onRefresh: () => void;
  onCancelOne: (id: string) => void;
  onCancelAll: () => void;
}

export const ScheduledListSection: React.FC<ScheduledListSectionProps> = ({
  notifications,
  onRefresh,
  onCancelOne,
  onCancelAll,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>
            Rappels programmés ({notifications.length})
          </Text>
          <Text style={styles.subtitle}>Enregistrés dans le sous-système Android</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>

          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.cancelAllButton}
              onPress={onCancelAll}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelAllText}>Tout annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Aucune notification active</Text>
          <Text style={styles.emptyText}>
            Utilisez les boutons ci-dessus pour programmer un test à court terme ou le scénario de référence.
          </Text>
        </View>
      ) : (
        notifications.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemBadge}>
                <Text style={styles.itemBadgeText}>{item.triggerType}</Text>
              </View>
              <TouchableOpacity
                onPress={() => onCancelOne(item.id)}
                style={styles.deleteButton}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteText}>✕ Annuler</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.itemTitle}>{item.title || '(Sans titre)'}</Text>
            <Text style={styles.itemBody}>{item.body}</Text>

            <View style={styles.triggerInfoBox}>
              <Text style={styles.triggerLabel}>Déclenchement :</Text>
              <Text style={styles.triggerValue}>{item.triggerDetails}</Text>
            </View>

            <Text style={styles.idLabel}>ID Android : {item.id}</Text>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  refreshButton: {
    padding: 6,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  refreshButtonText: {
    fontSize: 16,
  },
  cancelAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: THEME.colors.dangerBg,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.danger,
  },
  cancelAllText: {
    color: THEME.colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptyText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  itemCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemBadge: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.round,
  },
  itemBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: THEME.colors.dangerBg,
    borderRadius: THEME.borderRadius.round,
  },
  deleteText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.danger,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  itemBody: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  triggerInfoBox: {
    backgroundColor: '#FAF5EE',
    padding: 8,
    borderRadius: THEME.borderRadius.sm,
    marginTop: 8,
  },
  triggerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
  },
  triggerValue: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: 1,
  },
  idLabel: {
    fontSize: 9,
    color: '#9E9498',
    marginTop: 6,
  },
});
