import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
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

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

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
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mois précédent" onPress={goToPreviousMonth} style={styles.navBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={THEME.colors.textPrimary} strokeWidth={1.8} />
        </TouchableOpacity>

        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Revenir à aujourd’hui" onPress={goToToday} activeOpacity={0.7}>
          <View style={styles.monthLabel}>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES_FR[displayMonth - 1]} {displayYear}
            </Text>

          </View>
        </TouchableOpacity>

        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mois suivant" onPress={goToNextMonth} style={styles.navBtn} activeOpacity={0.7}>
          <ChevronRight size={22} color={THEME.colors.textPrimary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarCard}>
        {/* Jours de la semaine */}
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((day, index) => (
            <View key={`${day}_${index}`} style={styles.weekdayCell}>
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
                style={styles.dayCell}
                accessibilityRole="button"
                accessibilityLabel={`${dayNum} ${MONTH_NAMES_FR[displayMonth - 1]}${hasBirthday ? `, ${birthdayCount} anniversaire${birthdayCount > 1 ? 's' : ''}` : ''}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedDay(dayNum === selectedDay ? null : dayNum)}
                activeOpacity={0.7}
              >
                <View style={[styles.dayBadge, isToday && styles.todayBadge, isSelected && styles.selectedBadge]}>
                  <Text style={[styles.dayText, isSelected && styles.selectedText]}>{dayNum}</Text>
                </View>
                {hasBirthday && (
                  <View style={styles.dotRow}>
                    {Array.from({ length: Math.min(birthdayCount, 3) }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          birthdayCount > 1 ? styles.dotLilac : styles.dotApricot,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
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
                  accessibilityRole="button"
                  accessibilityLabel={profile.name}
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
                    {nextAge !== null && <Text style={styles.profileMeta}>{nextAge} ans</Text>}
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
    paddingHorizontal: 20,
    marginTop: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surface,
  },
  monthLabel: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  calendarCard: { paddingTop: 5 },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 7,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    height: 49,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  todayBadge: { borderColor: THEME.colors.primary },
  selectedBadge: { backgroundColor: THEME.colors.primary },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    position: 'absolute',
    bottom: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2,
    backgroundColor: THEME.colors.primary,
  },
  dotApricot: { backgroundColor: '#C86917' },
  dotLilac: { backgroundColor: '#9660B3' },
  detailCard: {
    backgroundColor: '#FFF0E8',
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 10,
  },
  detailEmpty: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.colors.lavender,
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
    fontSize: 15,
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
