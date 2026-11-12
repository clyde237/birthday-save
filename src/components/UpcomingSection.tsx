import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, CakeSlice, ChevronRight } from 'lucide-react-native';
import { BirthdayProfile } from '../types';
import { THEME } from '../constants/theme';
import {
  getSortedUpcomingBirthdays,
  MONTH_NAMES_FR,
  resolveEffectiveBirthday,
} from '../utils/dateUtils';

interface UpcomingSectionProps {
  birthdays: BirthdayProfile[];
  onOpenProfile: (birthday: BirthdayProfile) => void;
  onOpenSettings: () => void;
}

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const UpcomingSection: React.FC<UpcomingSectionProps> = ({
  birthdays,
  onOpenProfile,
  onOpenSettings,
}) => {
  const sorted = getSortedUpcomingBirthdays(birthdays);
  const featured = sorted[0];
  const featuredGroup = featured
    ? sorted.filter(birthday => birthday.next.nextDate.getTime() === featured.next.nextDate.getTime())
    : [];
  const featuredIds = new Set(featuredGroup.map(birthday => birthday.id));
  const upcomingGroups = new Map<string, typeof sorted>();

  for (const birthday of sorted.filter(item => !featuredIds.has(item.id))) {
    const key = `${birthday.next.nextDate.getFullYear()}-${birthday.next.nextDate.getMonth()}`;
    const group = upcomingGroups.get(key) ?? [];
    group.push(birthday);
    upcomingGroups.set(key, group);
  }

  const getDaysLabel = (days: number, isToday: boolean) => {
    if (isToday) return 'Aujourd’hui';
    if (days === 1) return 'Demain';
    return `Dans ${days} jours`;
  };

  const featuredCardContent = featured && (
    <>
      <View style={styles.featuredContent}>
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>{getDaysLabel(featured.next.daysRemaining, featured.next.isToday)}</Text>
        </View>
        {featuredGroup.length === 1 ? (
          <Text style={styles.featuredName} numberOfLines={2}>{featured.name}</Text>
        ) : (
          <>
            <Text style={styles.sharedBirthdayTitle}>
              {featuredGroup.length} anniversaires à fêter
            </Text>
            <View style={styles.sharedBirthdayNames}>
              {featuredGroup.map(birthday => (
                <TouchableOpacity
                  key={birthday.id}
                  style={styles.sharedBirthdayName}
                  onPress={() => onOpenProfile(birthday)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Ouvrir la fiche de ${birthday.name}`}
                >
                  <Text style={styles.sharedBirthdayNameText} numberOfLines={1}>{birthday.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        <Text style={styles.featuredDate}>
          {featured.next.nextDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
        </Text>
        {featuredGroup.length === 1 && featured.nextAge !== null && (
          <Text style={styles.featuredAge}>Fête ses {featured.nextAge} ans</Text>
        )}
      </View>
      <Image
        source={require('../../assets/birthday-save-brand/illustrations/birthday-cake.png')}
        style={styles.cakeArt}
        resizeMode="contain"
        accessible={false}
      />
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Image
          source={require('../../assets/birthday-save-brand/logo/bs-fond-clair-128.png')}
          style={styles.logo}
          accessibilityLabel="Birthday-save"
        />
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onOpenSettings}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir les paramètres de notification"
        >
          <Bell size={23} color={THEME.colors.primary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <Text accessibilityRole="header" style={styles.pageTitle}>À venir</Text>

      {featured && featuredGroup.length === 1 ? (
        <TouchableOpacity
          style={styles.featuredCard}
          onPress={() => onOpenProfile(featured)}
          activeOpacity={0.9}
        >
          {featuredCardContent}
        </TouchableOpacity>
      ) : featured ? (
        <View style={[styles.featuredCard, styles.sharedFeaturedCard]}>
          {featuredCardContent}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <CakeSlice size={32} color={THEME.colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Aucun anniversaire</Text>
          <Text style={styles.emptyText}>Appuyez sur + pour ajouter un anniversaire.</Text>
        </View>
      )}

      {Array.from(upcomingGroups.entries()).map(([key, group]) => {
        const [year, monthIndex] = key.split('-').map(Number);
        const monthTitle = MONTH_NAMES_FR[monthIndex].toLocaleLowerCase('fr-FR');
        return (
          <View key={key} style={styles.monthSection}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>En {monthTitle}</Text>
              <Text style={styles.sectionYear}>{year}</Text>
            </View>

            {group.map((birthday, index) => {
              const next = birthday.next.nextDate;
              const effective = resolveEffectiveBirthday(birthday.birthMonth, birthday.birthDay, next.getFullYear());
              const isFeb29Adjusted = birthday.birthMonth === 2 && birthday.birthDay === 29 && effective.day === 28;
              return (
                <TouchableOpacity
                  key={birthday.id}
                  style={styles.birthdayRow}
                  onPress={() => onOpenProfile(birthday)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.dateTile, index % 2 === 0 ? styles.dateTileLavender : styles.dateTilePeach]}>
                    <Text style={styles.dateDay}>{next.getDate()}</Text>
                    <Text style={styles.dateMonth}>{MONTHS_SHORT[next.getMonth()]}</Text>
                  </View>
                  <View style={styles.birthdayInfo}>
                    <Text style={styles.birthdayName} numberOfLines={1}>{birthday.name}</Text>
                    <Text style={styles.birthdayMeta}>
                      {isFeb29Adjusted ? 'Fêté le 28' : getDaysLabel(birthday.next.daysRemaining, birthday.next.isToday)}
                      {birthday.nextAge !== null ? ` · ${birthday.nextAge} ans` : ''}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={THEME.colors.textSecondary} strokeWidth={1.8} />
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  logo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  notificationButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: THEME.colors.cardBackground,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  pageTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 18,
  },
  featuredCard: {
    minHeight: 205,
    borderRadius: 28,
    padding: 21,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFD6B4',
    marginBottom: 25,
  },
  featuredContent: {
    flex: 1,
    zIndex: 1,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  eyebrowText: {
    color: THEME.colors.primaryDark,
    fontSize: 14,
    fontWeight: '600',
  },
  featuredName: {
    color: THEME.colors.textPrimary,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '800',
    maxWidth: 165,
  },
  sharedFeaturedCard: {
    alignItems: 'flex-start',
  },
  sharedBirthdayTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    maxWidth: 170,
  },
  sharedBirthdayNames: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 9,
    maxWidth: 180,
  },
  sharedBirthdayName: {
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
  },
  sharedBirthdayNameText: {
    color: THEME.colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  featuredDate: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    marginTop: 5,
    fontWeight: '500',
  },
  featuredAge: {
    color: THEME.colors.primaryDark,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  cakeArt: {
    width: 130,
    height: 170,
    marginRight: -7,
  },
  monthSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionYear: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  birthdayRow: {
    minHeight: 67,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1EB',
    borderRadius: 20,
    marginBottom: 8,
  },
  dateTile: {
    width: 57,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginRight: 13,
  },
  dateTileLavender: {
    backgroundColor: THEME.colors.lavender,
  },
  dateTilePeach: {
    backgroundColor: THEME.colors.peach,
  },
  dateDay: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '800',
  },
  dateMonth: {
    color: THEME.colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayName: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  birthdayMeta: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 25,
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: THEME.colors.surface,
    marginBottom: 13,
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 17,
  },
});
