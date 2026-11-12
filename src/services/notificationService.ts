import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  PermissionReport,
  ScheduledNotificationInfo,
  ReminderType,
} from '../types';
import { calculateEveDate, resolveEffectiveBirthday, formatFrenchDateTime } from '../utils/dateUtils';

export const NOTIFICATION_CHANNEL_ID = 'default';

// Configuration du gestionnaire quand l'application est au premier plan (SDK 58)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

/**
 * Configure le canal de notification Android (Android 8.0+)
 * Protégé contre les restrictions spécifiques d'Expo Go
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Rappels d’anniversaire',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#AE1F4D',
        enableVibrate: true,
        showBadge: true,
      });
    } catch (error) {
      // Dans Expo Go, certaines versions d'Android restreignent la manipulation de canaux
      console.warn('Configuration du canal de notification (utilisation du canal système par défaut) :', error);
    }
  }
}

/**
 * Récupère l'état actuel des permissions de notification
 */
export async function getNotificationPermissions(): Promise<PermissionReport> {
  const settings = await Notifications.getPermissionsAsync();
  const isAndroid = Platform.OS === 'android';
  const channel = isAndroid ? await Notifications.getNotificationChannelAsync(NOTIFICATION_CHANNEL_ID) : null;
  const exact = isAndroid ? await Notifications.getExactAlarmPermissionsAsync() : null;
  const channelBlocked = channel?.importance === Notifications.AndroidImportance.NONE;
  return {
    status: settings.status,
    granted: !channelBlocked && (settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL),
    canAskAgain: !channelBlocked && settings.canAskAgain,
    androidImportance: channel?.importance ?? settings.android?.importance,
    exactAlarms: exact?.granted,
    channelBlocked,
  };
}

export async function requestNotificationPermissions(): Promise<PermissionReport> {
  await setupNotificationChannel();
  await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return getNotificationPermissions();
}

/**
 * Déclenche une notification immédiate pour vérifier l'affichage et le canal
 */
export async function triggerImmediateNotification(): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎂 Test immédiat · Birthday-save',
      body: 'Le canal de notification fonctionne parfaitement sur votre appareil !',
      sound: true,
      color: '#AE1F4D',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { test: 'immediate', timestamp: Date.now() },
    },
    trigger: null,
  });
  return id;
}

/**
 * Programme un rappel à court terme (en secondes) pour les tests hors ligne / verrouillé
 */
export async function scheduleShortTermReminder(
  seconds: number,
  title: string = '🎂 Rappel test court terme',
  body: string = `Rappel programmé il y a ${seconds}s (test hors ligne & écran verrouillé)`
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      color: '#AE1F4D',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        type: 'short_term_test',
        scheduledAt: Date.now(),
        delaySeconds: seconds,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, seconds),
      channelId: NOTIFICATION_CHANNEL_ID,
    },
  });
  return id;
}

/**
 * Programme un rappel annuel récurrent (Expo Yearly Trigger)
 * Note : dans Expo, `month` est indexé de 0 à 11 !
 */
export async function scheduleYearlyReminder(
  profileName: string,
  birthMonth: number, // 1 - 12
  birthDay: number,   // 1 - 31
  type: ReminderType,
  hour: number,
  minute: number,
  delivery: 'bestEffort' | 'alarmClock' = 'bestEffort',
  profileId?: string
): Promise<string> {
  const currentYear = new Date().getFullYear();
  let targetDay = birthDay;
  let targetMonth = birthMonth;

  if (type === 'day_before') {
    const eve = calculateEveDate(birthMonth, birthDay, currentYear);
    targetDay = eve.day;
    targetMonth = eve.month;
  } else {
    const eff = resolveEffectiveBirthday(birthMonth, birthDay, currentYear);
    targetDay = eff.day;
    targetMonth = eff.month;
  }

  const titlePrefix = type === 'day_before' ? '⏳ Demain' : '🎉 Aujourd’hui';
  const title = `${titlePrefix} : Anniversaire de ${profileName} !`;
  const body = type === 'day_before'
    ? `N'oubliez pas, l'anniversaire de ${profileName} est demain.`
    : `C'est le grand jour pour ${profileName} ! Pensez à lui souhaiter.`;

  // Important : Expo Notifications utilise month 0..11 pour les triggers calendrier
  const expoMonthZeroIndexed = targetMonth - 1;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      color: '#AE1F4D',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        profileName,
        ...(profileId ? { profileId } : {}),
        birthMonth,
        birthDay,
        reminderType: type,
        hour,
        minute,
        delivery,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.YEARLY,
      day: targetDay,
      month: expoMonthZeroIndexed,
      hour,
      minute,
      channelId: NOTIFICATION_CHANNEL_ID,
      delivery,
    },
  });

  return id;
}

/**
 * Programme le scénario de référence du PRD : Maman (2 février)
 * - Rappel 1 : Veille (1er fév à 19h00)
 * - Rappel 2 : Jour même (2 fév à 06h00)
 */
export async function scheduleMamanReferenceScenario(
  delivery: 'bestEffort' | 'alarmClock' = 'bestEffort'
): Promise<{ idEve: string; idDay: string }> {
  const idEve = await scheduleYearlyReminder('Maman', 2, 2, 'day_before', 19, 0, delivery);
  const idDay = await scheduleYearlyReminder('Maman', 2, 2, 'same_day', 6, 0, delivery);
  return { idEve, idDay };
}

/**
 * Récupère et analyse toutes les notifications actuellement planifiées
 */
export async function getScheduledNotificationsList(diagnosticsOnly = false): Promise<ScheduledNotificationInfo[]> {
  try {
    const rawList = await Notifications.getAllScheduledNotificationsAsync();

    return rawList
      .filter(item => !diagnosticsOnly || !item.content.data?.profileId)
      .map((item) => {
      let triggerType = 'Inconnu';
      let triggerDetails = 'Non spécifié';
      let nextTriggerDate: string | undefined;

      const trigger = item.trigger as any;
      if (trigger) {
        if (trigger.type === 'timeInterval' || trigger.type === Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL) {
          triggerType = 'Intervalle';
          const seconds = trigger.seconds ?? '?';
          triggerDetails = `Dans ${seconds} seconde(s) (répète: ${trigger.repeats ? 'oui' : 'non'})`;
        } else if (trigger.type === 'yearly' || trigger.type === Notifications.SchedulableTriggerInputTypes.YEARLY) {
          triggerType = 'Annuel';
          const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
          const m = trigger.month !== undefined ? months[trigger.month] ?? `${trigger.month + 1}` : '?';
          const d = trigger.day ?? '?';
          const h = String(trigger.hour ?? 0).padStart(2, '0');
          const min = String(trigger.minute ?? 0).padStart(2, '0');
          triggerDetails = `Chaque année le ${d} ${m} à ${h}h${min} (${trigger.delivery ?? 'bestEffort'})`;
        } else if (trigger.type === 'date' || trigger.type === Notifications.SchedulableTriggerInputTypes.DATE) {
          triggerType = 'Date précise';
          const d = new Date(trigger.value ?? trigger.date);
          triggerDetails = formatFrenchDateTime(d);
        } else {
          triggerType = String(trigger.type || 'Standard');
          triggerDetails = JSON.stringify(trigger);
        }

        if (trigger.value) {
          try {
            nextTriggerDate = formatFrenchDateTime(new Date(trigger.value));
          } catch {
            // ignore
          }
        }
      }

      return {
        id: item.identifier,
        title: item.content.title,
        body: item.content.body,
        triggerType,
        triggerDetails,
        nextTriggerDate,
        rawTrigger: item.trigger,
      };
    });
  } catch (error) {
    console.warn('Erreur lecture notifications planifiées:', error);
    return [];
  }
}

/**
 * Annule une notification spécifique
 */
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * Annule toutes les notifications programmées
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
