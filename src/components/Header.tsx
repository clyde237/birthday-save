import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { THEME } from '../constants/theme';

export const Header: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>🎂 BS</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Birthday-save</Text>
          <Text style={styles.subtitle}>Banc d’essai · Lot 1 (Prototype & Notifications)</Text>
        </View>
      </View>
      <View style={styles.badgeRow}>
        <View style={styles.lotBadge}>
          <Text style={styles.lotBadgeText}>Lot 1 : P0</Text>
        </View>
        <Text style={styles.hintText}>Android · Offline-first · Expo Go</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.primary,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: THEME.spacing.lg,
    borderBottomLeftRadius: THEME.borderRadius.xl,
    borderBottomRightRadius: THEME.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  logoBadge: {
    backgroundColor: THEME.colors.surface,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.accentSubtle,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  lotBadge: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.round,
  },
  lotBadgeText: {
    color: THEME.colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  hintText: {
    color: '#FFE8DC',
    fontSize: 12,
  },
});
