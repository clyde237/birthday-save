import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BirthdayProfile } from '../types';
import { THEME } from '../constants/theme';
import {
  getNextBirthdayDate,
  calculateNextAge,
  MONTH_NAMES_FR,
  resolveEffectiveBirthday,
} from '../utils/dateUtils';

interface UpcomingSectionProps {
  birthdays: BirthdayProfile[];
  onOpenProfile: (birthday: BirthdayProfile) => void;
  onAddNew: () => void;
}

export const UpcomingSection: React.FC<UpcomingSectionProps> = ({
  birthdays,
  onOpenProfile,
  onAddNew,
}) => {
  // Trier par jours restants croissants (Aujourd'hui en premier)
  const sorted = [...birthdays]
    .map((b) => {
      const next = getNextBirthdayDate(b.birthMonth, b.birthDay);
      const nextAge = calculateNextAge(b.birthYear, next.nextDate);
      return { ...b, next, nextAge };
    })
    .sort((a, b) => a.next.daysRemaining - b.next.daysRemaining);

  const getBadgeStyle = (daysRemaining: number, isToday: boolean) => {
    if (isToday) return { bg: THEME.colors.primary, text: '#FFFFFF' };
    if (daysRemaining === 1) return { bg: THEME.colors.accent, text: '#FFFFFF' };
    if (daysRemaining <= 7) return { bg: THEME.colors.warningBg, text: THEME.colors.warning };
    if (daysRemaining <= 30) return { bg: '#E0F2FE', text: '#0284C7' };
    return { bg: THEME.colors.surface, text: THEME.colors.textSecondary };
  };

  const getLabel = (daysRemaining: number, isToday: boolean) => {
    if (isToday) return 'Aujourd\'hui';
    if (daysRemaining === 1) return 'Demain';
    return `Dans ${daysRemaining} j`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>🎂 À venir</Text>
          <Text style={styles.subtitle}>
            {sorted.length} anniversaire{sorted.length !== 1 ? 's' : ''} enregistré{sorted.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onAddNew} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🎈</Text>
          <Text style={styles.emptyTitle}>Aucun anniversaire</Text>
          <Text style={styles.emptyText}>
            Ajoutez votre premier anniversaire pour voir les prochaines dates ici.
          </Text>
        </View>
      ) : (
        sorted.map((item) => {
          const badge = getBadgeStyle(item.next.daysRemaining, item.next.isToday);
          const label = getLabel(item.next.daysRemaining, item.next.isToday);
          const monthName = MONTH_NAMES_FR[item.birthMonth - 1];
          const currentYear = new Date().getFullYear();
          const effective = resolveEffectiveBirthday(item.birthMonth, item.birthDay, currentYear);
          const isFeb29Adjusted = item.birthMonth === 2 && item.birthDay === 29 && effective.day === 28;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.upcomingCard,
                item.next.isToday ? styles.upcomingCardToday : null,
              ]}
              onPress={() => onOpenProfile(item)}
              activeOpacity={0.7}
            >
              <View style={styles.leftSection}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.centerSection}>
                <View style={styles.nameRow}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.nextAge !== null && (
                    <View style={styles.agePill}>
                      <Text style={styles.ageText}>{item.nextAge} ans</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dateText}>
                  {item.birthDay === 1 ? '1er' : item.birthDay} {monthName}
                  {item.birthYear ? ` · né(e) en ${item.birthYear}` : ''}
                  {isFeb29Adjusted ? ' · fêté le 28' : ''}
                </Text>
              </View>

              <View style={[styles.daysBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.daysBadgeText, { color: badge.text }]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptyText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  upcomingCardToday: {
    borderColor: THEME.colors.primary,
    borderWidth: 2,
    backgroundColor: '#FFF5F7',
  },
  leftSection: {
    marginRight: THEME.spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  centerSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  agePill: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: THEME.borderRadius.round,
  },
  ageText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  dateText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  daysBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.round,
    marginLeft: 8,
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
