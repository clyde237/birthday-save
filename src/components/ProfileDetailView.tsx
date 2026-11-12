import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { BirthdayProfile } from '../types';
import { THEME } from '../constants/theme';
import {
  getNextBirthdayDate,
  calculateNextAge,
  MONTH_NAMES_FR,
  resolveEffectiveBirthday,
  getNextReminderOccurrence,
  formatFrenchDateTime,
} from '../utils/dateUtils';
import { getGlobalSettings } from '../database/settingsRepository';

interface ProfileDetailViewProps {
  birthday: BirthdayProfile;
  onEdit: () => void;
  onDelete: () => void;
  onGoBack: () => void;
}

export const ProfileDetailView: React.FC<ProfileDetailViewProps> = ({
  birthday,
  onEdit,
  onDelete,
  onGoBack,
}) => {
  const { nextDate, daysRemaining, isToday } = getNextBirthdayDate(
    birthday.birthMonth,
    birthday.birthDay
  );
  const nextAge = calculateNextAge(birthday.birthYear, nextDate);
  const currentYear = new Date().getFullYear();
  const effective = resolveEffectiveBirthday(birthday.birthMonth, birthday.birthDay, currentYear);
  const monthName = MONTH_NAMES_FR[birthday.birthMonth - 1];
  const isFeb29Adjusted = birthday.birthMonth === 2 && birthday.birthDay === 29 && effective.day === 28;

  const globalSettings = getGlobalSettings();
  const mode = birthday.reminder?.mode ?? 'default';

  // Calcul des prochaines notifications
  const reminders: { label: string; date: string }[] = [];

  if (mode !== 'disabled') {
    const isDefault = mode === 'default';

    const dayBeforeActive = isDefault
      ? globalSettings.dayBeforeEnabled
      : birthday.reminder?.customDayBeforeEnabled;
    const dayBeforeHour = isDefault
      ? globalSettings.dayBeforeHour
      : birthday.reminder?.customDayBeforeHour ?? 19;
    const dayBeforeMinute = isDefault
      ? globalSettings.dayBeforeMinute
      : birthday.reminder?.customDayBeforeMinute ?? 0;

    const sameDayActive = isDefault
      ? globalSettings.sameDayEnabled
      : birthday.reminder?.customSameDayEnabled;
    const sameDayHour = isDefault
      ? globalSettings.sameDayHour
      : birthday.reminder?.customSameDayHour ?? 6;
    const sameDayMinute = isDefault
      ? globalSettings.sameDayMinute
      : birthday.reminder?.customSameDayMinute ?? 0;

    if (dayBeforeActive) {
      const nextEve = getNextReminderOccurrence(
        birthday.birthMonth,
        birthday.birthDay,
        'day_before',
        dayBeforeHour,
        dayBeforeMinute
      );
      reminders.push({
        label: `⏳ La veille à ${dayBeforeHour}h${String(dayBeforeMinute).padStart(2, '0')}`,
        date: formatFrenchDateTime(nextEve),
      });
    }

    if (sameDayActive) {
      const nextDay = getNextReminderOccurrence(
        birthday.birthMonth,
        birthday.birthDay,
        'same_day',
        sameDayHour,
        sameDayMinute
      );
      reminders.push({
        label: `🎉 Le jour même à ${sameDayHour}h${String(sameDayMinute).padStart(2, '0')}`,
        date: formatFrenchDateTime(nextDay),
      });
    }
  }

  const modeLabels: Record<string, { emoji: string; text: string; color: string }> = {
    default: { emoji: '🔔', text: 'Réglages par défaut', color: THEME.colors.primary },
    custom: { emoji: '⚙', text: 'Personnalisés', color: '#0284C7' },
    disabled: { emoji: '🔕', text: 'Désactivés', color: THEME.colors.textSecondary },
  };
  const modeInfo = modeLabels[mode] || modeLabels['default'];

  const handleDeleteConfirm = () => {
    Alert.alert(
      'Supprimer la fiche ?',
      `Êtes-vous sûr de vouloir supprimer l'anniversaire de ${birthday.name} ? Ses rappels programmés seront annulés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Bouton retour */}
      <TouchableOpacity style={styles.backBtn} onPress={onGoBack} activeOpacity={0.7}>
        <Text style={styles.backBtnText}>◂ Retour</Text>
      </TouchableOpacity>

      {/* En-tête profil */}
      <View style={styles.heroCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {birthday.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.heroName}>{birthday.name}</Text>

        <Text style={styles.heroDate}>
          {birthday.birthDay === 1 ? '1er' : birthday.birthDay} {monthName}
          {birthday.birthYear ? ` ${birthday.birthYear}` : ''}
        </Text>

        {isFeb29Adjusted && (
          <Text style={styles.feb29Note}>
            📌 Fêté le 28 février cette année (année non bissextile)
          </Text>
        )}

        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>
            {isToday
              ? '🎉 C\'est aujourd\'hui !'
              : daysRemaining === 1
              ? '⏳ C\'est demain !'
              : `Dans ${daysRemaining} jours`}
          </Text>
        </View>

        {nextAge !== null && (
          <Text style={styles.ageInfo}>
            Aura {nextAge} ans
          </Text>
        )}
      </View>

      {/* Mode de rappel */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Rappels</Text>
        <View style={[styles.modePill, { borderColor: modeInfo.color }]}>
          <Text style={[styles.modePillText, { color: modeInfo.color }]}>
            {modeInfo.emoji} {modeInfo.text}
          </Text>
        </View>

        {reminders.length > 0 ? (
          reminders.map((r, idx) => (
            <View key={idx} style={styles.reminderItem}>
              <Text style={styles.reminderLabel}>{r.label}</Text>
              <Text style={styles.reminderDate}>Prochain : {r.date}</Text>
            </View>
          ))
        ) : mode === 'disabled' ? (
          <Text style={styles.disabledText}>Aucun rappel programmé pour cette fiche.</Text>
        ) : (
          <Text style={styles.disabledText}>Aucun rappel actif.</Text>
        )}
      </View>

      {/* Notes */}
      {birthday.notes ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>💡 {birthday.notes}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.8}>
          <Text style={styles.editBtnText}>✎ Modifier</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteConfirm} activeOpacity={0.8}>
          <Text style={styles.deleteBtnText}>✕ Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  heroCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    marginBottom: THEME.spacing.md,
  },
  avatarLargeText: {
    fontSize: 30,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  heroDate: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  feb29Note: {
    fontSize: 11,
    color: THEME.colors.warning,
    fontWeight: '600',
    marginBottom: 6,
  },
  heroBadge: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.round,
    marginBottom: 4,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  ageInfo: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  modePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.round,
    marginBottom: 8,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reminderItem: {
    backgroundColor: THEME.colors.surface,
    padding: 8,
    borderRadius: THEME.borderRadius.sm,
    marginBottom: 6,
  },
  reminderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  reminderDate: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  disabledText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.xl,
  },
  editBtn: {
    flex: 1,
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: THEME.colors.dangerBg,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: THEME.colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
});
