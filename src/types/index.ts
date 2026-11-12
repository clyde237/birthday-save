import * as Notifications from 'expo-notifications';

export type ReminderMode = 'default' | 'custom' | 'disabled';
export type ReminderType = 'same_day' | 'day_before';

export interface GlobalReminderSettings {
  dayBeforeEnabled: boolean;
  dayBeforeHour: number; // 0 - 23
  dayBeforeMinute: number; // 0 - 59
  sameDayEnabled: boolean;
  sameDayHour: number; // 0 - 23
  sameDayMinute: number; // 0 - 59
}

export interface BirthdayReminderConfig {
  mode: ReminderMode;
  customDayBeforeEnabled: boolean;
  customDayBeforeHour: number;
  customDayBeforeMinute: number;
  customSameDayEnabled: boolean;
  customSameDayHour: number;
  customSameDayMinute: number;
  notificationIds?: string[];
}

export interface BirthdayProfile {
  id: string;
  name: string;
  birthDay: number; // 1 - 31
  birthMonth: number; // 1 - 12
  birthYear?: number;
  notes?: string;
  reminder: BirthdayReminderConfig;
}

export interface PermissionReport {
  status: Notifications.PermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
  isExpoGo?: boolean;
  androidImportance?: number;
  exactAlarms?: boolean;
  channelBlocked?: boolean;
}
