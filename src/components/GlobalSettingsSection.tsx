import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Bell, Clock } from 'lucide-react-native';
import type { GlobalReminderSettings, PermissionReport } from '../types';
import { THEME } from '../constants/theme';
import { formatReminderTime, parseReminderTime } from '../utils/reminderRules';
import { ReminderTimeInput } from './ReminderTimeInput';

interface Props {
  settings: GlobalReminderSettings;
  permission: PermissionReport | null;
  saving: boolean;
  syncFailed: boolean;
  onRequestPermission: () => void;
  onRequestExactAlarm: () => void;
  onRetry: () => void;
  onSave: (settings: GlobalReminderSettings) => Promise<boolean>;
}

export function GlobalSettingsSection({
  settings, permission, saving, syncFailed, onRequestPermission, onRequestExactAlarm, onRetry, onSave,
}: Props) {
  const [eveEnabled, setEveEnabled] = useState(settings.dayBeforeEnabled);
  const [dayEnabled, setDayEnabled] = useState(settings.sameDayEnabled);
  const [eveTime, setEveTime] = useState(formatReminderTime(settings.dayBeforeHour, settings.dayBeforeMinute));
  const [dayTime, setDayTime] = useState(formatReminderTime(settings.sameDayHour, settings.sameDayMinute));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEveEnabled(settings.dayBeforeEnabled);
    setDayEnabled(settings.sameDayEnabled);
    setEveTime(formatReminderTime(settings.dayBeforeHour, settings.dayBeforeMinute));
    setDayTime(formatReminderTime(settings.sameDayHour, settings.sameDayMinute));
  }, [settings.dayBeforeEnabled, settings.sameDayEnabled, settings.dayBeforeHour, settings.dayBeforeMinute, settings.sameDayHour, settings.sameDayMinute]);

  const save = async () => {
    const eve = eveEnabled ? parseReminderTime(eveTime) : { hour: settings.dayBeforeHour, minute: settings.dayBeforeMinute };
    const day = dayEnabled ? parseReminderTime(dayTime) : { hour: settings.sameDayHour, minute: settings.sameDayMinute };
    if (!eve || !day) {
      setError('Saisissez un horaire entre 00:00 et 23:59.');
      return;
    }
    setError('');
    setSaved(await onSave({
      dayBeforeEnabled: eveEnabled, dayBeforeHour: eve.hour, dayBeforeMinute: eve.minute,
      sameDayEnabled: dayEnabled, sameDayHour: day.hour, sameDayMinute: day.minute,
    }));
  };

  const reminders = [
    { label: 'La veille', enabled: eveEnabled, time: eveTime, setEnabled: setEveEnabled, setTime: setEveTime },
    { label: 'Le jour même', enabled: dayEnabled, time: dayTime, setEnabled: setDayEnabled, setTime: setDayTime },
  ];
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.heading}>
          <Clock size={20} color={THEME.colors.primary} />
          <Text accessibilityRole="header" style={styles.title}>Rappels par défaut</Text>
        </View>
        <Text style={styles.caption}>Ces horaires s’appliquent aux fiches qui utilisent les réglages par défaut.</Text>
        {reminders.map(({ label, enabled, time, setEnabled, setTime }) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            {enabled && <ReminderTimeInput label={`Horaire · ${label}`} value={time} onChange={value => { setSaved(false); setTime(value); }} disabled={saving} />}
            <Switch
              accessibilityLabel={`Activer le rappel · ${label}`}
              disabled={saving}
              value={enabled}
              onValueChange={value => { setSaved(false); setEnabled(value); }}
              trackColor={{ false: THEME.colors.border, true: THEME.colors.primary }}
            />
          </View>
        ))}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {saved && <Text accessibilityLiveRegion="polite" style={styles.caption}>Horaires enregistrés.</Text>}
        <TouchableOpacity style={styles.primaryButton} onPress={save} disabled={saving} accessibilityRole="button">
          <Text style={styles.primaryText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.heading}>
          <Bell size={20} color={THEME.colors.primary} />
          <Text accessibilityRole="header" style={styles.title}>Notifications</Text>
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.caption}>
          {permission === null
            ? syncFailed ? 'L’état des autorisations est indisponible.' : 'Vérification des autorisations…'
            : permission.channelBlocked ? 'Le canal des rappels est désactivé dans les réglages Android.'
            : !permission.granted ? 'Les notifications sont bloquées sur cet appareil.'
            : permission.exactAlarms === false ? 'Les rappels peuvent arriver après l’heure choisie.'
            : 'Les notifications sont autorisées.'}
        </Text>
        {permission && !permission.granted && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onRequestPermission} accessibilityRole="button">
            <Text style={styles.secondaryText}>{permission.canAskAgain ? 'Autoriser les notifications' : 'Ouvrir les réglages'}</Text>
          </TouchableOpacity>
        )}
        {permission?.granted && permission.exactAlarms === false && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onRequestExactAlarm} accessibilityRole="button">
            <Text style={styles.secondaryText}>Autoriser les alarmes exactes</Text>
          </TouchableOpacity>
        )}
        {syncFailed && (
          <>
            <Text accessibilityRole="alert" style={styles.error}>Certains rappels n’ont pas pu être mis à jour.</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={onRetry} accessibilityRole="button">
              <Text style={styles.secondaryText}>Réessayer</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginTop: 18, gap: 14 },
  card: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { color: THEME.colors.textPrimary, fontSize: 18, fontWeight: '800', flexShrink: 1 },
  caption: { color: THEME.colors.textSecondary, fontSize: 14, lineHeight: 21 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderColor: THEME.colors.borderLight },
  label: { flex: 1, color: THEME.colors.textPrimary, fontSize: 15, fontWeight: '700' },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: THEME.colors.primary, marginTop: 6 },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  secondaryButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  secondaryText: { color: THEME.colors.primaryDark, fontWeight: '800', fontSize: 14 },
  error: { color: THEME.colors.danger, fontSize: 14 },
});
