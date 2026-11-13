import { getDatabase } from './db';
import { BirthdayProfile, BirthdayReminderConfig, ReminderMode } from '../types';
import { isRelation } from '../constants/relations';
import { DEFAULT_PROFILE_THEME_ID, isProfileThemeId } from '../constants/profileThemes';
import { deleteProfileImage, persistProfileImage } from '../services/profileImageService';
import { validateBirthdayInput, type CreateBirthdayInput } from '../utils/birthdayValidation';
export { validateBirthdayInput, type CreateBirthdayInput, type ValidationError } from '../utils/birthdayValidation';

function parseNotificationIds(value?: string | null): string[] {
  try {
    const ids: unknown = JSON.parse(value ?? '[]');
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
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
    relation?: string | null;
    profile_image_uri?: string | null;
    color_theme?: string | null;
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
      id, name, birth_day, birth_month, birth_year, notes, relation, profile_image_uri, color_theme,
      reminder_mode, custom_day_before_enabled, custom_day_before_hour, custom_day_before_minute,
      custom_same_day_enabled, custom_same_day_hour, custom_same_day_minute, notification_ids
    FROM birthdays
    ORDER BY birth_month ASC, birth_day ASC, name ASC
  `);

  return rows.map((r) => {
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
      notificationIds: parseNotificationIds(r.notification_ids),
    };

    return {
      id: r.id,
      name: r.name,
      birthDay: r.birth_day,
      birthMonth: r.birth_month,
      birthYear: r.birth_year ?? undefined,
      notes: r.notes ?? undefined,
      relation: isRelation(r.relation) ? r.relation : undefined,
      profileImageUri: r.profile_image_uri ?? undefined,
      colorTheme: isProfileThemeId(r.color_theme) ? r.color_theme : DEFAULT_PROFILE_THEME_ID,
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

  const profileImageUri = input.profileImageUri
    ? await persistProfileImage(input.profileImageUri, id)
    : undefined;

  try {
    db.runSync(
    `INSERT INTO birthdays (
      id, name, birth_day, birth_month, birth_year, notes, relation, profile_image_uri, color_theme,
      reminder_mode, custom_day_before_enabled, custom_day_before_hour, custom_day_before_minute,
      custom_same_day_enabled, custom_same_day_hour, custom_same_day_minute, notification_ids,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name.trim(),
      input.birthDay,
      input.birthMonth,
      input.birthYear ?? null,
      input.notes?.trim() ?? null,
      input.relation ?? null,
      profileImageUri ?? null,
      input.colorTheme ?? DEFAULT_PROFILE_THEME_ID,
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
  } catch (error) {
    if (profileImageUri) {
      try {
        await deleteProfileImage(profileImageUri);
      } catch (cleanupError) {
        console.warn('Nettoyage de la photo de profil après échec de création impossible :', cleanupError);
      }
    }
    throw error;
  }

  return {
    id,
    name: input.name.trim(),
    birthDay: input.birthDay,
    birthMonth: input.birthMonth,
    birthYear: input.birthYear,
    notes: input.notes?.trim(),
    relation: input.relation,
    profileImageUri,
    colorTheme: input.colorTheme ?? DEFAULT_PROFILE_THEME_ID,
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
  const existing = db.getFirstSync<{ profile_image_uri: string | null }>(
    `SELECT profile_image_uri FROM birthdays WHERE id = ?`,
    [id]
  );
  if (!existing) throw new Error('Cette fiche est introuvable.');
  const previousImageUri = existing.profile_image_uri ?? undefined;
  const profileImageUri = input.profileImageUri
    ? await persistProfileImage(input.profileImageUri, id)
    : undefined;

  const reminderMode = input.reminder?.mode ?? 'default';
  const customDayBeforeEnabled = input.reminder?.customDayBeforeEnabled ?? true;
  const customDayBeforeHour = input.reminder?.customDayBeforeHour ?? 19;
  const customDayBeforeMinute = input.reminder?.customDayBeforeMinute ?? 0;
  const customSameDayEnabled = input.reminder?.customSameDayEnabled ?? true;
  const customSameDayHour = input.reminder?.customSameDayHour ?? 6;
  const customSameDayMinute = input.reminder?.customSameDayMinute ?? 0;

  let result: ReturnType<typeof db.runSync>;
  try {
    result = db.runSync(
    `UPDATE birthdays SET
      name = ?, birth_day = ?, birth_month = ?, birth_year = ?, notes = ?, relation = ?, profile_image_uri = ?, color_theme = ?,
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
      input.relation ?? null,
      profileImageUri ?? null,
      input.colorTheme ?? DEFAULT_PROFILE_THEME_ID,
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
  } catch (error) {
    if (profileImageUri && profileImageUri !== previousImageUri) {
      try {
        await deleteProfileImage(profileImageUri);
      } catch (cleanupError) {
        console.warn('Nettoyage de la photo de profil après échec de modification impossible :', cleanupError);
      }
    }
    throw error;
  }

  if (result.changes === 0) throw new Error('Cette fiche est introuvable.');
  if (previousImageUri && previousImageUri !== profileImageUri) {
    try {
      await deleteProfileImage(previousImageUri);
    } catch (error) {
      console.warn('Suppression de l’ancienne photo de profil impossible :', error);
    }
  }

  return {
    id,
    name: input.name.trim(),
    birthDay: input.birthDay,
    birthMonth: input.birthMonth,
    birthYear: input.birthYear,
    notes: input.notes?.trim(),
    relation: input.relation,
    profileImageUri,
    colorTheme: input.colorTheme ?? DEFAULT_PROFILE_THEME_ID,
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
  const row = db.getFirstSync<{ notification_ids: string; profile_image_uri: string | null }>(
    `SELECT notification_ids, profile_image_uri FROM birthdays WHERE id = ?`,
    [id]
  );
  db.runSync(`DELETE FROM birthdays WHERE id = ?`, [id]);
  try {
    await deleteProfileImage(row?.profile_image_uri ?? undefined);
  } catch (error) {
    console.warn('Suppression de la photo du profil impossible :', error);
  }
  return parseNotificationIds(row?.notification_ids);
}
