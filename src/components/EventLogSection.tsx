import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';
import { NotificationLogItem } from '../types';

interface EventLogSectionProps {
  logs: NotificationLogItem[];
  onClearLogs: () => void;
}

export const EventLogSection: React.FC<EventLogSectionProps> = ({ logs, onClearLogs }) => {
  const getBadgeColor = (type: NotificationLogItem['type']) => {
    switch (type) {
      case 'received':
        return { bg: THEME.colors.successBg, text: THEME.colors.success };
      case 'response':
        return { bg: '#E0F2FE', text: '#0284C7' };
      case 'scheduled':
        return { bg: THEME.colors.surface, text: THEME.colors.primary };
      case 'cancelled':
        return { bg: THEME.colors.warningBg, text: THEME.colors.warning };
      case 'error':
        return { bg: THEME.colors.dangerBg, text: THEME.colors.danger };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Journal d’activité en direct ({logs.length})</Text>
          <Text style={styles.subtitle}>Événements captés par les écouteurs Expo</Text>
        </View>

        {logs.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearLogs}
            activeOpacity={0.7}
          >
            <Text style={styles.clearText}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun événement enregistré pour l'instant.</Text>
        </View>
      ) : (
        logs.map((log) => {
          const colors = getBadgeColor(log.type);
          return (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={[styles.typeBadge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.typeBadgeText, { color: colors.text }]}>
                    {log.type.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.timestamp}>{log.timestamp}</Text>
              </View>

              <Text style={styles.logTitle}>{log.title}</Text>
              <Text style={styles.logDetails}>{log.details}</Text>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.xxl,
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
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  emptyText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  logCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.round,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  timestamp: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  logDetails: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
});
