import { getDatabase } from './db';
import { GlobalReminderSettings } from '../types';

export const DEFAULT_GLOBAL_SETTINGS: GlobalReminderSettings = {
  dayBeforeEnabled: true,
  dayBeforeHour: 19,
  dayBeforeMinute: 0,
  sameDayEnabled: true,
  sameDayHour: 6,
  sameDayMinute: 0,
};

export function getGlobalSettings(): GlobalReminderSettings {
  const db = getDatabase();
  const row = db.getFirstSync<{
    day_before_enabled: number;
    day_before_hour: number;
    day_before_minute: number;
    same_day_enabled: number;
    same_day_hour: number;
    same_day_minute: number;
  }>(`SELECT day_before_enabled, day_before_hour, day_before_minute, same_day_enabled, same_day_hour, same_day_minute FROM global_settings WHERE id = 'global'`);

  if (!row) {
    return DEFAULT_GLOBAL_SETTINGS;
  }

  return {
    dayBeforeEnabled: row.day_before_enabled === 1,
    dayBeforeHour: row.day_before_hour,
    dayBeforeMinute: row.day_before_minute,
    sameDayEnabled: row.same_day_enabled === 1,
    sameDayHour: row.same_day_hour,
    sameDayMinute: row.same_day_minute,
  };
}

export function saveGlobalSettings(settings: GlobalReminderSettings): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE global_settings
     SET day_before_enabled = ?, day_before_hour = ?, day_before_minute = ?,
         same_day_enabled = ?, same_day_hour = ?, same_day_minute = ?
     WHERE id = 'global'`,
    [
      settings.dayBeforeEnabled ? 1 : 0,
      settings.dayBeforeHour,
      settings.dayBeforeMinute,
      settings.sameDayEnabled ? 1 : 0,
      settings.sameDayHour,
      settings.sameDayMinute,
    ]
  );
}
