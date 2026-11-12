import * as Notifications from 'expo-notifications';
import { isRunningInExpoGo } from 'expo';
import type { PermissionResponse } from 'expo';
import { Platform } from 'react-native';
import type { PermissionReport } from '../types';

export const NOTIFICATION_CHANNEL_ID = 'default';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android' || isRunningInExpoGo()) return;

  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Rappels d’anniversaire',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#AE1F4D',
      enableVibrate: true,
      showBadge: true,
    });
  } catch (error) {
    console.warn('Configuration du canal de notification impossible :', error);
  }
}

export async function getNotificationPermissions(): Promise<PermissionReport> {
  const settings = await Notifications.getPermissionsAsync();
  const isAndroid = Platform.OS === 'android';
  const isExpoGo = isRunningInExpoGo();
  let channel: Notifications.NotificationChannel | null = null;
  let exact: PermissionResponse | null = null;

  if (isAndroid && !isExpoGo) {
    try {
      channel = await Notifications.getNotificationChannelAsync(NOTIFICATION_CHANNEL_ID);
    } catch (error) {
      console.warn('Lecture du canal de notification impossible :', error);
    }

    try {
      exact = await Notifications.getExactAlarmPermissionsAsync();
    } catch (error) {
      console.warn('Lecture des autorisations d’alarmes exactes impossible :', error);
    }
  }

  const channelBlocked = channel?.importance === Notifications.AndroidImportance.NONE;

  return {
    status: settings.status,
    granted: !channelBlocked && (
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ),
    canAskAgain: !channelBlocked && settings.canAskAgain,
    isExpoGo,
    androidImportance: channel?.importance ?? settings.android?.importance,
    exactAlarms: isAndroid ? (isExpoGo ? false : exact?.granted) : undefined,
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

export async function sendNotificationCheck(): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Birthday-save',
      body: 'Votre appareil reçoit bien les notifications.',
      sound: true,
      color: '#AE1F4D',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { type: 'notification_check' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      channelId: NOTIFICATION_CHANNEL_ID,
    },
  });
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
