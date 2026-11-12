import type { BirthdayProfile, BirthdayReminderConfig, GlobalReminderSettings, ReminderType } from '../types';
import { calculateEveDate, getNextReminderOccurrence, resolveEffectiveBirthday } from './dateUtils';

export const VARIABLE_REMINDER_YEARS = 5;

export function getEffectiveReminderSettings(
  reminder: BirthdayReminderConfig,
  defaults: GlobalReminderSettings
): GlobalReminderSettings {
  if (reminder.mode === 'default') return defaults;
  return {
    dayBeforeEnabled: reminder.mode === 'custom' && reminder.customDayBeforeEnabled,
    dayBeforeHour: reminder.customDayBeforeHour,
    dayBeforeMinute: reminder.customDayBeforeMinute,
    sameDayEnabled: reminder.mode === 'custom' && reminder.customSameDayEnabled,
    sameDayHour: reminder.customSameDayHour,
    sameDayMinute: reminder.customSameDayMinute,
  };
}

export function getReminderRules(settings: GlobalReminderSettings) {
  return [
    { type: 'day_before' as const, label: 'La veille', enabled: settings.dayBeforeEnabled, hour: settings.dayBeforeHour, minute: settings.dayBeforeMinute },
    { type: 'same_day' as const, label: 'Le jour même', enabled: settings.sameDayEnabled, hour: settings.sameDayHour, minute: settings.sameDayMinute },
  ];
}

export function parseReminderTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

export function formatReminderTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function isValidReminderTime(hour: number, minute: number): boolean {
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 &&
    Number.isInteger(minute) && minute >= 0 && minute <= 59;
}

interface PlannedReminder {
  identifier: string;
  type: ReminderType;
  occurrence: Date;
  yearly: boolean;
  hour: number;
  minute: number;
}

export function planBirthdayReminders(
  birthday: BirthdayProfile,
  defaults: GlobalReminderSettings,
  now: Date
): PlannedReminder[] {
  const plans: PlannedReminder[] = [];
  for (const rule of getReminderRules(getEffectiveReminderSettings(birthday.reminder, defaults))) {
    if (!rule.enabled) continue;
    const { birthMonth, birthDay } = birthday;
    const variable = (birthMonth === 2 && birthDay === 29) ||
      (birthMonth === 3 && birthDay === 1 && rule.type === 'day_before');
    const prefix = `birthday:${birthday.id}:${rule.type}`;
    if (!variable) {
      plans.push({
        identifier: prefix,
        type: rule.type,
        occurrence: getNextReminderOccurrence(birthMonth, birthDay, rule.type, rule.hour, rule.minute, now),
        yearly: true,
        hour: rule.hour,
        minute: rule.minute,
      });
      continue;
    }

    let scheduledYears = 0;
    for (let year = now.getFullYear(); scheduledYears < VARIABLE_REMINDER_YEARS; year++) {
      const date = rule.type === 'day_before'
        ? calculateEveDate(birthMonth, birthDay, year)
        : resolveEffectiveBirthday(birthMonth, birthDay, year);
      const occurrence = new Date(date.year, date.month - 1, date.day, rule.hour, rule.minute);
      if (occurrence > now) {
        plans.push({ identifier: `${prefix}:${year}`, type: rule.type, occurrence, yearly: false, hour: rule.hour, minute: rule.minute });
        scheduledYears++;
      }
    }
  }
  return plans;
}
