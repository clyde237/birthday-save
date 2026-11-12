import { getDatabase } from './db';
import { BirthdayProfile, BirthdayReminderConfig, ReminderMode } from '../types';
import { getDaysInMonth, isLeapYear } from '../utils/dateUtils';

export interface CreateBirthdayInput {
  name: string;
  birthDay: number;
  birthMonth: number;
  birthYear?: number;
  notes?: string;
  reminder?: Partial<BirthdayReminderConfig>;
}

export interface ValidationError {
  field: 'name' | 'birthDay' | 'birthMonth' | 'birthYear';
  message: string;
}

export function validateBirthdayInput(input: CreateBirthdayInput): ValidationError[] {
  const errors: ValidationError[] = [];

  const trimmedName = input.name?.trim();
  if (!trimmedName || trimmedName.length === 0) {
    errors.push({ field: 'name', message: 'Le prénom ou surnom est obligatoire.' });
  }

  if (input.birthMonth < 1 || input.birthMonth > 12) {
    errors.push({ field: 'birthMonth', message: 'Le mois doit être compris entre 1 et 12.' });
  }

  const maxDays = input.birthMonth === 2 ? 29 : getDaysInMonth(2025, input.birthMonth);
  if (input.birthDay < 1 || input.birthDay > maxDays) {
    errors.push({ field: 'birthDay', message: `Jour invalide pour ce mois (max ${maxDays}).` });
  }

  if (input.birthYear !== undefined && input.birthYear !== null) {
    const currentYear = new Date().getFullYear();
    if (input.birthYear > currentYear) {
      errors.push({ field: 'birthYear', message: 'L’année de naissance ne peut pas être dans le futur.' });
    } else if (input.birthYear < 1900) {
      errors.push({ field: 'birthYear', message: 'L’année de naissance doit être supérieure à 1900.' });
    } else if (input.birthMonth === 2 && input.birthDay === 29 && !isLeapYear(input.birthYear)) {
      errors.push({
        field: 'birthYear',
        message: `${input.birthYear} n’était pas une année bissextile (le 29 février n’existait pas).`,
      });
    }
  }

  return errors;
}

export async function getAllBirthdays(): Promise<BirthdayProfile[]> {
  const db = getDatabase();
  const rows = db.getAllSync<{
    id: string;
    name: string;
    birth_day: number;
    birth_month: number;
    birth_year: number | null;
    notes: string | null;
    reminder_mode?: string | null;
    custom_day_before_enabled?: number | null;
    custom_day_before_hour?: number | null;
    custom_day_before_minute?: number | null;
    custom_same_day_enabled?: number | null;
    custom_same_day_hour?: number | null;
    custom_same_day_minute?: number | null;
    notification_ids?: string | null;
  }>(`
    SELECT
      id, name, birth_day, birth_month, birth_year, notes,
      reminder_mode, custom_day_before_enabled, custom_day_before_hour, custom_day_before_minute,
      custom_same_day_enabled, custom_same_day_hour, custom_same_day_minute, notification_ids
    FROM birthdays
    ORDER BY birth_month ASC, birth_day ASC, name ASC
  `);

  return rows.map((r) => {
    let notifIds: string[] = [];
    if (r.notification_ids) {
      try {
        notifIds = JSON.parse(r.notification_ids);
      } catch {
        notifIds = [];
      }
    }

    const modeRaw = r.reminder_mode;
    const mode: ReminderMode =
      modeRaw === 'custom' || modeRaw === 'disabled' ? modeRaw : 'default';

    const reminder: BirthdayReminderConfig = {
      mode,
      customDayBeforeEnabled: r.custom_day_before_enabled !== 0,
      customDayBeforeHour: r.custom_day_before_hour ?? 19,
      customDayBeforeMinute: r.custom_day_before_minute ?? 0,
      customSameDayEnabled: r.custom_same_day_enabled !== 0,
      customSameDayHour: r.custom_same_day_hour ?? 6,
      customSameDayMinute: r.custom_same_day_minute ?? 0,
      notificationIds: notifIds,
    };

    return {
      id: r.id,
      name: r.name,
      birthDay: r.birth_day,
      birthMonth: r.birth_month,
      birthYear: r.birth_year ?? undefined,
      notes: r.notes ?? undefined,
      reminder,
    };
  });
}

export async function getBirthdaysByReminderMode(mode: ReminderMode): Promise<BirthdayProfile[]> {
  const all = await getAllBirthdays();
  return all.filter((b) => (b.reminder?.mode ?? 'default') === mode);
}

export async function createBirthday(input: CreateBirthdayInput): Promise<BirthdayProfile> {
  const errors = validateBirthdayInput(input);
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join(' '));
  }

  const db = getDatabase();
  const id = `bday_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const reminder: BirthdayReminderConfig = {
    mode: input.reminder?.mode ?? 'default',
    customDayBeforeEnabled: input.reminder?.customDayBeforeEnabled ?? true,
    customDayBeforeHour: input.reminder?.customDayBeforeHour ?? 19,
    customDayBeforeMinute: input.reminder?.customDayBeforeMinute ?? 0,
    customSameDayEnabled: input.reminder?.customSameDayEnabled ?? true,
    customSameDayHour: input.reminder?.customSameDayHour ?? 6,
    customSameDayMinute: input.reminder?.customSameDayMinute ?? 0,
    notificationIds: [],
  };

  db.runSync(
    `INSERT INTO birthdays (
      id, name, birth_day, birth_month, birth_year, notes,
      reminder_mode, custom_day_before_enabled, custom_day_before_hour, custom_day_before_minute,
      custom_same_day_enabled, custom_same_day_hour, custom_same_day_minute, notification_ids,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name.trim(),
      input.birthDay,
      input.birthMonth,
      input.birthYear ?? null,
      input.notes?.trim() ?? null,
      reminder.mode,
      reminder.customDayBeforeEnabled ? 1 : 0,
      reminder.customDayBeforeHour,
      reminder.customDayBeforeMinute,
      reminder.customSameDayEnabled ? 1 : 0,
      reminder.customSameDayHour,
      reminder.customSameDayMinute,
      JSON.stringify(reminder.notificationIds),
      now,
      now,
    ]
  );

  return {
    id,
    name: input.name.trim(),
    birthDay: input.birthDay,
    birthMonth: input.birthMonth,
    birthYear: input.birthYear,
    notes: input.notes?.trim(),
    reminder,
  };
}

export async function updateBirthday(id: string, input: CreateBirthdayInput): Promise<BirthdayProfile> {
  const errors = validateBirthdayInput(input);
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join(' '));
  }

  const db = getDatabase();
  const now = Date.now();

  const reminderMode = input.reminder?.mode ?? 'default';
  const customDayBeforeEnabled = input.reminder?.customDayBeforeEnabled ?? true;
  const customDayBeforeHour = input.reminder?.customDayBeforeHour ?? 19;
  const customDayBeforeMinute = input.reminder?.customDayBeforeMinute ?? 0;
  const customSameDayEnabled = input.reminder?.customSameDayEnabled ?? true;
  const customSameDayHour = input.reminder?.customSameDayHour ?? 6;
  const customSameDayMinute = input.reminder?.customSameDayMinute ?? 0;

  db.runSync(
    `UPDATE birthdays SET
      name = ?, birth_day = ?, birth_month = ?, birth_year = ?, notes = ?,
      reminder_mode = ?, custom_day_before_enabled = ?, custom_day_before_hour = ?, custom_day_before_minute = ?,
      custom_same_day_enabled = ?, custom_same_day_hour = ?, custom_same_day_minute = ?,
      updated_at = ?
     WHERE id = ?`,
    [
      input.name.trim(),
      input.birthDay,
      input.birthMonth,
      input.birthYear ?? null,
      input.notes?.trim() ?? null,
      reminderMode,
      customDayBeforeEnabled ? 1 : 0,
      customDayBeforeHour,
      customDayBeforeMinute,
      customSameDayEnabled ? 1 : 0,
      customSameDayHour,
      customSameDayMinute,
      now,
      id,
    ]
  );

  return {
    id,
    name: input.name.trim(),
    birthDay: input.birthDay,
    birthMonth: input.birthMonth,
    birthYear: input.birthYear,
    notes: input.notes?.trim(),
    reminder: {
      mode: reminderMode,
      customDayBeforeEnabled,
      customDayBeforeHour,
      customDayBeforeMinute,
      customSameDayEnabled,
      customSameDayHour,
      customSameDayMinute,
    },
  };
}

export async function updateNotificationIdsForBirthday(id: string, notificationIds: string[]): Promise<void> {
  const db = getDatabase();
  db.runSync(`UPDATE birthdays SET notification_ids = ? WHERE id = ?`, [
    JSON.stringify(notificationIds),
    id,
  ]);
}

export async function deleteBirthday(id: string): Promise<string[]> {
  const db = getDatabase();
  const row = db.getFirstSync<{ notification_ids: string }>(
    `SELECT notification_ids FROM birthdays WHERE id = ?`,
    [id]
  );
  let oldNotifIds: string[] = [];
  if (row && row.notification_ids) {
    try {
      oldNotifIds = JSON.parse(row.notification_ids);
    } catch {
      oldNotifIds = [];
    }
  }

  db.runSync(`DELETE FROM birthdays WHERE id = ?`, [id]);
  return oldNotifIds;
}
