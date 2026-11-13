import React from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BirthdayProfile } from '../types';
import { THEME } from '../constants/theme';
import {
  getNextBirthdayDate,
  calculateNextAge,
  MONTH_NAMES_FR,
  resolveEffectiveBirthday,
} from '../utils/dateUtils';
import { getGlobalSettings } from '../database/settingsRepository';

interface BirthdayCardProps {
  birthday: BirthdayProfile;
  onEdit: (b: BirthdayProfile) => void;
  onDelete: (id: string, name: string) => void;
}

export const BirthdayCard: React.FC<BirthdayCardProps> = ({ birthday, onEdit, onDelete }) => {
  const { nextDate, daysRemaining, isToday } = getNextBirthdayDate(
    birthday.birthMonth,
    birthday.birthDay
  );

  const nextAge = calculateNextAge(birthday.birthYear, nextDate);
  const currentYear = new Date().getFullYear();
  const effectiveDay = resolveEffectiveBirthday(
    birthday.birthMonth,
    birthday.birthDay,
    currentYear
  );

  const getBadgeStyle = () => {
    if (isToday) return { bg: THEME.colors.primary, text: '#FFFFFF', label: 'Aujourd’hui' };
    if (daysRemaining === 1) return { bg: THEME.colors.accent, text: '#FFFFFF', label: 'Demain' };
    if (daysRemaining <= 7) return { bg: THEME.colors.warningBg, text: THEME.colors.warning, label: `Dans ${daysRemaining} jours` };
    return { bg: THEME.colors.surface, text: THEME.colors.textPrimary, label: `Dans ${daysRemaining} jours` };
  };

  const badge = getBadgeStyle();
  const monthName = MONTH_NAMES_FR[birthday.birthMonth - 1];

  const getReminderLabel = () => {
    const reminder = birthday.reminder;
    const mode = reminder?.mode ?? 'default';

    if (mode === 'disabled') {
      return { text: 'Rappels désactivés', color: THEME.colors.textSecondary, bg: '#F3EFEA' };
    }
    if (mode === 'default') {
      const g = getGlobalSettings();
      const parts = [];
      if (g.dayBeforeEnabled) parts.push(`Veille ${g.dayBeforeHour}h`);
      if (g.sameDayEnabled) parts.push(`Jour J ${g.sameDayHour}h`);
      return { text: `Par défaut (${parts.join(', ')})`, color: THEME.colors.primary, bg: THEME.colors.surface };
    }
    // Mode personnalisé
    const parts = [];
    if (reminder?.customDayBeforeEnabled) parts.push(`Veille ${reminder.customDayBeforeHour}h`);
    if (reminder?.customSameDayEnabled) parts.push(`Jour J ${reminder.customSameDayHour}h`);
    const label = parts.length > 0 ? parts.join(', ') : 'Aucun';
    return { text: `Personnalisé (${label})`, color: '#8D3A78', bg: THEME.colors.lavender };
  };

  const reminderBadge = getReminderLabel();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          {birthday.profileImageUri
            ? <Image source={{ uri: birthday.profileImageUri }} style={styles.avatarImage} />
            : <Text style={styles.avatarText}>{birthday.name.charAt(0).toUpperCase()}</Text>}
        </View>

        <View style={styles.nameContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.nameText}>{birthday.name}</Text>
            {nextAge !== null && (
              <View style={styles.ageBadge}>
                <Text style={styles.ageText}>{nextAge} ans</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateText}>
            {birthday.birthDay === 1 ? '1er' : birthday.birthDay} {monthName}
            {birthday.birthYear ? ` ${birthday.birthYear}` : ''}
            {birthday.birthMonth === 2 && birthday.birthDay === 29 && effectiveDay.day === 28 ? ' · fêté le 28 fév' : ''}
          </Text>
        </View>

        <View style={[styles.daysBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.daysBadgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Badge du mode de rappel */}
      <View style={styles.reminderRow}>
        <View style={[styles.reminderPill, { backgroundColor: reminderBadge.bg }]}>
          <Text style={[styles.reminderPillText, { color: reminderBadge.color }]}>
            {reminderBadge.text}
          </Text>
        </View>
      </View>

      {birthday.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesText} numberOfLines={2}>
            💡 {birthday.notes}
          </Text>
        </View>
      ) : null}

      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(birthday)}
          activeOpacity={0.7}
        >
          <Text style={styles.editButtonText}>✎ Modifier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(birthday.id, birthday.name)}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>✕ Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: 22,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.035,
    shadowRadius: 5,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  avatar: {
    width: 49,
    height: 49,
    borderRadius: 18,
    backgroundColor: THEME.colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  nameContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  ageBadge: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: THEME.borderRadius.round,
  },
  ageText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  dateText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  daysBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.round,
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reminderRow: {
    flexDirection: 'row',
    marginTop: 9,
  },
  reminderPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.round,
  },
  reminderPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: THEME.colors.background,
    padding: 10,
    borderRadius: 13,
    marginTop: 9,
  },
  notesText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: THEME.spacing.md,
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.danger,
  },
});
