import type { BirthdayReminderConfig } from '../types';
import { isRelation, type Relation } from '../constants/relations';
import { isProfileThemeId, type ProfileThemeId } from '../constants/profileThemes';
import { getDaysInMonth, isLeapYear } from './dateUtils';
import { isValidReminderTime } from './reminderRules';

export interface CreateBirthdayInput {
  name: string;
  birthDay: number;
  birthMonth: number;
  birthYear?: number;
  notes?: string;
  relation?: Relation;
  profileImageUri?: string | null;
  colorTheme?: ProfileThemeId;
  reminder?: Partial<BirthdayReminderConfig>;
}
export interface ValidationError {
  field: 'name' | 'birthDay' | 'birthMonth' | 'birthYear' | 'relation' | 'colorTheme' | 'reminder';
  message: string;
}

export function validateBirthdayInput(input: CreateBirthdayInput, now = new Date()): ValidationError[] {
  const errors: ValidationError[] = [];

  const trimmedName = input.name?.trim();
  if (!trimmedName || trimmedName.length === 0) {
    errors.push({ field: 'name', message: 'Le prénom ou surnom est obligatoire.' });
  }

  const validMonth = Number.isInteger(input.birthMonth) && input.birthMonth >= 1 && input.birthMonth <= 12;
  if (!validMonth) {
    errors.push({ field: 'birthMonth', message: 'Le mois doit être compris entre 1 et 12.' });
  }

  const maxDays = !validMonth ? 31 : input.birthMonth === 2 ? 29 : getDaysInMonth(2025, input.birthMonth);
  const validDay = Number.isInteger(input.birthDay) && input.birthDay >= 1 && input.birthDay <= maxDays;
  if (!validDay) {
    errors.push({ field: 'birthDay', message: `Jour invalide pour ce mois (max ${maxDays}).` });
  }

  if (input.birthYear !== undefined && input.birthYear !== null) {
    if (!Number.isInteger(input.birthYear) || input.birthYear < 1900) {
      errors.push({ field: 'birthYear', message: 'Saisissez une année de naissance valide à partir de 1900.' });
    } else if (input.birthYear > now.getFullYear() ||
      (validMonth && validDay && new Date(input.birthYear, input.birthMonth - 1, input.birthDay) > now)) {
      errors.push({ field: 'birthYear', message: 'La date de naissance ne peut pas être dans le futur.' });
    } else if (input.birthMonth === 2 && input.birthDay === 29 && !isLeapYear(input.birthYear)) {
      errors.push({
        field: 'birthYear',
        message: `${input.birthYear} n’était pas une année bissextile (le 29 février n’existait pas).`,
      });
    }
  }

  if (input.relation !== undefined && !isRelation(input.relation)) {
    errors.push({ field: 'relation', message: 'Relation invalide.' });
  }

  if (input.colorTheme !== undefined && !isProfileThemeId(input.colorTheme)) {
    errors.push({ field: 'colorTheme', message: 'Palette de couleurs invalide.' });
  }

  const reminder = input.reminder;
  if (reminder && (
    !['default', 'custom', 'disabled'].includes(reminder.mode ?? 'default') ||
    !isValidReminderTime(reminder.customDayBeforeHour ?? 19, reminder.customDayBeforeMinute ?? 0) ||
    !isValidReminderTime(reminder.customSameDayHour ?? 6, reminder.customSameDayMinute ?? 0)
  )) {
    errors.push({ field: 'reminder', message: 'Saisissez des horaires entre 00:00 et 23:59.' });
  }

  return errors;
}
