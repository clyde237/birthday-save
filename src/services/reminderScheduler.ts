import * as Notifications from 'expo-notifications';
import type { BirthdayProfile, PermissionReport } from '../types';
import { cancelNotification, getNotificationPermissions, NOTIFICATION_CHANNEL_ID } from './notificationService';
import { getAllBirthdays, updateNotificationIdsForBirthday } from '../database/birthdayRepository';
import { getGlobalSettings } from '../database/settingsRepository';
import { planBirthdayReminders } from '../utils/reminderRules';

export type ReminderStatus = 'scheduled' | 'approximate' | 'disabled' | 'blocked' | 'failed';
type ScheduleResult = Record<string, ReminderStatus>;

let pendingSync: Promise<unknown> = Promise.resolve();

export function reconcileBirthdayReminders(removedIds: readonly string[] = []): Promise<ScheduleResult> {
  const sync = pendingSync.then(() => reconcile(removedIds));
  pendingSync = sync.catch(() => undefined);
  return sync;
}

async function reconcile(removedIds: readonly string[]): Promise<ScheduleResult> {
  const profiles = await getAllBirthdays();
  const settings = getGlobalSettings();
  const permission = await getNotificationPermissions();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const expected = new Map<string, Notifications.NotificationRequestInput>();
  const profileIds = new Set(profiles.map(profile => profile.id));
  const statuses: ScheduleResult = {};
  const ownedIds = new Map<string, string>();
  const removed = new Set(removedIds);

  for (const profile of profiles) {
    for (const id of profile.reminder.notificationIds ?? []) ownedIds.set(id, profile.id);
    const plans = planBirthdayReminders(profile, settings, now);
    statuses[profile.id] = getInitialStatus(plans.length, permission);
    for (const plan of plans) {
      const { occurrence, identifier, type } = plan;
      const trigger: Notifications.YearlyTriggerInput | Notifications.DateTriggerInput = plan.yearly
        ? {
            type: Notifications.SchedulableTriggerInputTypes.YEARLY,
            month: occurrence.getMonth(),
            day: occurrence.getDate(),
            hour: plan.hour,
            minute: plan.minute,
            channelId: NOTIFICATION_CHANNEL_ID,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: occurrence.getTime(),
            channelId: NOTIFICATION_CHANNEL_ID,
          };
      const signature = JSON.stringify([profile.name, trigger, permission.exactAlarms, timeZone]);
      const isEve = type === 'day_before';
      expected.set(identifier, {
        identifier,
        trigger,
        content: {
          title: `Anniversaire de ${profile.name}`,
          body: isEve ? 'Son anniversaire est demain.' : 'Son anniversaire est aujourd’hui.',
          sound: true,
          color: '#AE1F4D',
          data: { profileId: profile.id, reminderType: type, signature },
        },
      });
    }
  }

  const currentIds = new Map<string, string[]>();
  const remember = (profileId: string, id: string) => {
    const ids = currentIds.get(profileId) ?? [];
    ids.push(id);
    currentIds.set(profileId, ids);
  };

  let orphanCancellationFailed = false;
  for (const request of scheduled) {
    const data = request.content.data;
    const profileId = typeof data?.profileId === 'string' ? data.profileId : ownedIds.get(request.identifier);
    if (!profileId && !removed.has(request.identifier)) continue;

    const target = expected.get(request.identifier);
    if (profileId && target && target.content.data?.signature === data?.signature) {
      expected.delete(request.identifier);
      remember(profileId, request.identifier);
      continue;
    }
    try {
      await cancelNotification(request.identifier);
    } catch {
      if (profileId && profileIds.has(profileId)) {
        statuses[profileId] = 'failed';
        remember(profileId, request.identifier);
      } else {
        orphanCancellationFailed = true;
      }
    }
  }

  if (permission.granted) {
    for (const [id, request] of expected) {
      const profileId = request.content.data?.profileId as string;
      if (statuses[profileId] === 'failed') continue;
      // A punctual occurrence may pass while reconciling a large list.
      if (request.trigger && 'date' in request.trigger && Number(request.trigger.date) <= Date.now()) continue;
      try {
        await Notifications.scheduleNotificationAsync(request);
        remember(profileId, id);
      } catch {
        statuses[profileId] = 'failed';
      }
    }
  }

  for (const profile of profiles) {
    const previous = [...(profile.reminder.notificationIds ?? [])].sort();
    const ids = (currentIds.get(profile.id) ?? []).sort();
    if (previous.length !== ids.length || previous.some((id, index) => id !== ids[index])) {
      await updateNotificationIdsForBirthday(profile.id, ids);
    }
  }
  if (orphanCancellationFailed) throw new Error('Certains anciens rappels n’ont pas pu être annulés.');
  return statuses;
}

function getInitialStatus(count: number, permission: PermissionReport): ReminderStatus {
  if (count === 0) return 'disabled';
  if (!permission.granted) return 'blocked';
  return permission.exactAlarms === false ? 'approximate' : 'scheduled';
}

// The development-only list can still use the same reconciliation.
export async function syncRemindersForBirthday(profile: BirthdayProfile): Promise<string[]> {
  await reconcileBirthdayReminders();
  const current = (await getAllBirthdays()).find(birthday => birthday.id === profile.id);
  return current?.reminder.notificationIds ?? [];
}

export async function cancelRemindersList(notificationIds: string[]): Promise<void> {
  await reconcileBirthdayReminders(notificationIds);
}
