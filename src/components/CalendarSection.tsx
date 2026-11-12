import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BirthdayProfile } from '../types';
import { THEME } from '../constants/theme';
import {
  MONTH_NAMES_FR,
  getDaysInMonth,
  getBirthdaysByCalendarDay,
  calculateNextAge,
} from '../utils/dateUtils';

interface CalendarSectionProps {
  birthdays: BirthdayProfile[];
  onOpenProfile: (birthday: BirthdayProfile) => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  birthdays,
  onOpenProfile,
}) => {
  const today = new Date();
  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const birthdaysByDay = useMemo(
    () => getBirthdaysByCalendarDay(birthdays, displayMonth, displayYear),
    [birthdays, displayMonth, displayYear]
  );

  // Profils pour le jour sélectionné
  const selectedProfiles = selectedDay ? birthdaysByDay.get(selectedDay) || [] : [];

  // Navigation de mois
  const goToPreviousMonth = () => {
    if (displayMonth === 1) {
      setDisplayMonth(12);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (displayMonth === 12) {
      setDisplayMonth(1);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    const now = new Date();
    setDisplayYear(now.getFullYear());
    setDisplayMonth(now.getMonth() + 1);
    setSelectedDay(now.getDate());
  };

  // Calcul de la grille du calendrier
  const daysInMonth = getDaysInMonth(displayYear, displayMonth);
  const firstDayOfWeek = new Date(displayYear, displayMonth - 1, 1).getDay();
  // Convertir dimanche=0 en lundi=0
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const isCurrentMonth = displayYear === today.getFullYear() && displayMonth === today.getMonth() + 1;
  const todayDay = today.getDate();

  return (
    <View style={styles.container}>
      {/* En-tête du mois avec navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navBtn} activeOpacity={0.7}>
          <Text style={styles.navBtnText}>◀</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToToday} activeOpacity={0.7}>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES_FR[displayMonth - 1]} {displayYear}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn} activeOpacity={0.7}>
          <Text style={styles.navBtnText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Jours de la semaine */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Grille des jours */}
      <View style={styles.daysGrid}>
        {calendarCells.map((dayNum, idx) => {
          if (dayNum === null) {
            return <View key={`empty_${idx}`} style={styles.dayCell} />;
          }

          const hasBirthday = birthdaysByDay.has(dayNum);
          const birthdayCount = birthdaysByDay.get(dayNum)?.length || 0;
          const isToday = isCurrentMonth && dayNum === todayDay;
          const isSelected = selectedDay === dayNum;

          return (
            <TouchableOpacity
              key={`day_${dayNum}`}
              style={[
                styles.dayCell,
                isToday ? styles.todayCell : null,
                isSelected ? styles.selectedCell : null,
              ]}
              onPress={() => setSelectedDay(dayNum === selectedDay ? null : dayNum)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayText,
                  isToday ? styles.todayText : null,
                  isSelected ? styles.selectedText : null,
                ]}
              >
                {dayNum}
              </Text>
              {hasBirthday && (
                <View style={styles.dotRow}>
                  {Array.from({ length: Math.min(birthdayCount, 3) }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        isSelected || isToday ? styles.dotLight : null,
                      ]}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Détail du jour sélectionné */}
      {selectedDay !== null && (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>
            {selectedDay === 1 ? '1er' : selectedDay} {MONTH_NAMES_FR[displayMonth - 1]}
          </Text>

          {selectedProfiles.length === 0 ? (
            <Text style={styles.detailEmpty}>Aucun anniversaire ce jour.</Text>
          ) : (
            selectedProfiles.map((profile) => {
              const nextDate = new Date(displayYear, displayMonth - 1, selectedDay);
              const nextAge = calculateNextAge(profile.birthYear, nextDate);

              return (
                <TouchableOpacity
                  key={profile.id}
                  style={styles.profileRow}
                  onPress={() => onOpenProfile(profile)}
                  activeOpacity={0.7}
                >
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {profile.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.profileMeta}>
                      {nextAge !== null ? `${nextAge} ans · ` : ''}
                      {profile.birthYear ? `né(e) en ${profile.birthYear}` : 'Année non précisée'}
                    </Text>
                  </View>
                  <Text style={styles.profileArrow}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  navBtn: {
    padding: 8,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surface,
    width: 40,
    alignItems: 'center',
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  todayCell: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.round,
  },
  selectedCell: {
    backgroundColor: THEME.colors.accent,
    borderRadius: THEME.borderRadius.round,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.primary,
  },
  dotLight: {
    backgroundColor: '#FFFFFF',
  },
  detailCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  detailEmpty: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.sm,
  },
  profileAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  profileMeta: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  profileArrow: {
    fontSize: 20,
    color: THEME.colors.textSecondary,
    fontWeight: '300',
  },
});
