import {
  BirthdayProfile,
  GlobalReminderSettings,
  ReminderType,
} from '../types';
import {
  scheduleYearlyReminder,
  cancelNotification,
} from './notificationService';
import {
  updateNotificationIdsForBirthday,
  getBirthdaysByReminderMode,
} from '../database/birthdayRepository';
import { getGlobalSettings } from '../database/settingsRepository';

/**
 * Synchronise et programme les notifications pour un anniversaire donné.
 * Nettoie les anciens rappels et programme uniquement les nouveaux selon le mode.
 */
export async function syncRemindersForBirthday(
  profile: BirthdayProfile,
  globalSettings?: GlobalReminderSettings
): Promise<string[]> {
  const settings = globalSettings ?? getGlobalSettings();

  // 1. Annuler les anciens rappels existants pour cette fiche
  if (profile.reminder.notificationIds && profile.reminder.notificationIds.length > 0) {
    for (const notifId of profile.reminder.notificationIds) {
      try {
        await cancelNotification(notifId);
      } catch (err) {
        console.warn(`Erreur annulation rappel ${notifId}:`, err);
      }
    }
  }

  // 2. Si les rappels sont désactivés pour cette fiche, s'arrêter là
  if (profile.reminder.mode === 'disabled') {
    await updateNotificationIdsForBirthday(profile.id, []);
    return [];
  }

  // 3. Déterminer la configuration effective
  const isDefault = profile.reminder.mode === 'default';

  const dayBeforeActive = isDefault
    ? settings.dayBeforeEnabled
    : profile.reminder.customDayBeforeEnabled;
  const dayBeforeHour = isDefault
    ? settings.dayBeforeHour
    : profile.reminder.customDayBeforeHour;
  const dayBeforeMinute = isDefault
    ? settings.dayBeforeMinute
    : profile.reminder.customDayBeforeMinute;

  const sameDayActive = isDefault
    ? settings.sameDayEnabled
    : profile.reminder.customSameDayEnabled;
  const sameDayHour = isDefault
    ? settings.sameDayHour
    : profile.reminder.customSameDayHour;
  const sameDayMinute = isDefault
    ? settings.sameDayMinute
    : profile.reminder.customSameDayMinute;

  const newNotifIds: string[] = [];

  // 4. Programmer le rappel de la veille si activé
  if (dayBeforeActive) {
    try {
      const idEve = await scheduleYearlyReminder(
        profile.name,
        profile.birthMonth,
        profile.birthDay,
        'day_before',
        dayBeforeHour,
        dayBeforeMinute,
        'bestEffort',
        profile.id
      );
      newNotifIds.push(idEve);
    } catch (err) {
      console.warn(`Erreur programmation veille pour ${profile.name}:`, err);
    }
  }

  // 5. Programmer le rappel du jour même si activé
  if (sameDayActive) {
    try {
      const idDay = await scheduleYearlyReminder(
        profile.name,
        profile.birthMonth,
        profile.birthDay,
        'same_day',
        sameDayHour,
        sameDayMinute,
        'bestEffort',
        profile.id
      );
      newNotifIds.push(idDay);
    } catch (err) {
      console.warn(`Erreur programmation jour J pour ${profile.name}:`, err);
    }
  }

  // 6. Mettre à jour les IDs enregistrés dans SQLite
  await updateNotificationIdsForBirthday(profile.id, newNotifIds);
  return newNotifIds;
}

/**
 * Reprogramme uniquement les fiches qui héritent des réglages par défaut
 * (Règle PRD : Une modification des valeurs globales reprogramme uniquement les fiches qui en héritent).
 */
export async function syncAllDefaultInheritedReminders(
  newGlobalSettings: GlobalReminderSettings
): Promise<number> {
  const defaultProfiles = await getBirthdaysByReminderMode('default');

  for (const profile of defaultProfiles) {
    await syncRemindersForBirthday(profile, newGlobalSettings);
  }

  return defaultProfiles.length;
}

/**
 * Supprime les notifications associées lors de la suppression d'une fiche
 */
export async function cancelRemindersList(notificationIds: string[]): Promise<void> {
  for (const notifId of notificationIds) {
    try {
      await cancelNotification(notifId);
    } catch (err) {
      console.warn(`Erreur annulation ${notifId}:`, err);
    }
  }
}
