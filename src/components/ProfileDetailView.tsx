import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, CalendarDays, ChevronDown, Pencil, Trash2 } from 'lucide-react-native';
import type { BirthdayProfile, BirthdayReminderConfig, GlobalReminderSettings, ReminderMode } from '../types';
import type { ReminderStatus } from '../services/reminderScheduler';
import { THEME } from '../constants/theme';
import { getNextBirthdayDate, calculateNextAge, getNextReminderOccurrence, MONTH_NAMES_FR } from '../utils/dateUtils';
import { formatReminderTime, getEffectiveReminderSettings, getReminderRules, parseReminderTime, VARIABLE_REMINDER_YEARS } from '../utils/reminderRules';
import { ReminderTimeInput } from './ReminderTimeInput';

const MODES: Record<ReminderMode, string> = {
  default: 'Réglages par défaut',
  custom: 'Personnalisés',
  disabled: 'Désactivés',
};

const STATUS_TEXT: Record<ReminderStatus, string> = {
  scheduled: 'Rappels programmés.',
  approximate: 'Rappels programmés. Android peut les livrer après l’heure choisie.',
  blocked: 'Notifications bloquées. Vous pouvez les autoriser dans Paramètres.',
  disabled: 'Aucun rappel actif.',
  failed: 'Certains rappels n’ont pas pu être mis à jour. Réessayez dans Paramètres.',
};

interface Props {
  birthday: BirthdayProfile;
  defaults: GlobalReminderSettings;
  status?: ReminderStatus;
  saving: boolean;
  onSave: (reminder: BirthdayReminderConfig) => void;
  onEdit: () => void;
  onDelete: () => void;
  onGoBack: () => void;
}

function shortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function ProfileDetailView({ birthday, defaults, status, saving, onSave, onEdit, onDelete, onGoBack }: Props) {
  const { reminder } = birthday;
  const [draft, setDraft] = useState(reminder);
  const [eveTime, setEveTime] = useState(formatReminderTime(reminder.customDayBeforeHour, reminder.customDayBeforeMinute));
  const [dayTime, setDayTime] = useState(formatReminderTime(reminder.customSameDayHour, reminder.customSameDayMinute));
  const [showModes, setShowModes] = useState(false);
  const [error, setError] = useState('');
  const { nextDate } = getNextBirthdayDate(birthday.birthMonth, birthday.birthDay);
  const age = calculateNextAge(birthday.birthYear, nextDate);

  const effective = getEffectiveReminderSettings(draft, defaults);
  const rules = getReminderRules(effective);
  const isLeapBirthday = birthday.birthMonth === 2 && birthday.birthDay === 29;
  const variableReminders = rules.some(rule => rule.enabled && (
    isLeapBirthday || (birthday.birthMonth === 3 && birthday.birthDay === 1 && rule.type === 'day_before')
  ));

  const save = () => {
    const eve = draft.mode === 'custom' && draft.customDayBeforeEnabled
      ? parseReminderTime(eveTime) : { hour: draft.customDayBeforeHour, minute: draft.customDayBeforeMinute };
    const day = draft.mode === 'custom' && draft.customSameDayEnabled
      ? parseReminderTime(dayTime) : { hour: draft.customSameDayHour, minute: draft.customSameDayMinute };
    if (!eve || !day) {
      setError('Saisissez un horaire entre 00:00 et 23:59.');
      return;
    }
    setError('');
    onSave({
      ...draft,
      customDayBeforeHour: eve.hour, customDayBeforeMinute: eve.minute,
      customSameDayHour: day.hour, customSameDayMinute: day.minute,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.iconButton} onPress={onGoBack} accessibilityRole="button" accessibilityLabel="Retour">
            <ArrowLeft size={23} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.toolbarActions}>
            <TouchableOpacity style={styles.iconButton} disabled={saving} onPress={onEdit} accessibilityRole="button" accessibilityLabel="Modifier la fiche">
              <Pencil size={19} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Supprimer la fiche"
              onPress={() => Alert.alert('Supprimer l’anniversaire ?', birthday.name, [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: onDelete },
              ])}
            >
              <Trash2 size={19} color={THEME.colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.initial}>{Array.from(birthday.name)[0]?.toUpperCase()}</Text></View>
          <View style={styles.copy}>
            <Text accessibilityRole="header" style={styles.name}>{birthday.name}</Text>
            <Text style={styles.date}>{birthday.birthDay} {MONTH_NAMES_FR[birthday.birthMonth - 1].toLowerCase()}{birthday.birthYear ? ` ${birthday.birthYear}` : ''}</Text>
            {age !== null && <Text style={styles.secondary}>Fête ses {age} ans</Text>}
          </View>
        </View>

        <Text accessibilityRole="header" style={styles.heading}>Rappels annuels</Text>
        <TouchableOpacity
          accessibilityRole="button" accessibilityLabel="Mode des rappels"
          accessibilityState={{ expanded: showModes }} style={styles.mode}
          onPress={() => setShowModes(value => !value)} disabled={saving}
        >
          <Text style={styles.modeText}>{MODES[draft.mode]}</Text>
          <ChevronDown size={21} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        {showModes && (Object.keys(MODES) as ReminderMode[]).map(mode => (
          <TouchableOpacity
            key={mode} style={styles.modeChoice} accessibilityRole="button"
            accessibilityState={{ selected: draft.mode === mode }}
            onPress={() => { setDraft(current => ({ ...current, mode })); setShowModes(false); }}
          >
            <Text style={styles.modeText}>{MODES[mode]}</Text>
          </TouchableOpacity>
        ))}

        {draft.mode !== 'disabled' && rules.map(rule => {
          const isEve = rule.type === 'day_before';
          const time = isEve ? eveTime : dayTime;
          const parsed = draft.mode === 'custom' ? parseReminderTime(time) : rule;
          const occurrence = rule.enabled && parsed
            ? getNextReminderOccurrence(birthday.birthMonth, birthday.birthDay, rule.type, parsed.hour, parsed.minute)
            : null;
          return (
            <View key={rule.type} style={styles.rule}>
              <CalendarDays size={22} color={THEME.colors.textSecondary} />
              <View style={styles.copy}>
                <Text style={styles.ruleTitle}>{rule.label}</Text>
                <Text style={styles.secondary}>
                  {occurrence && parsed ? `${shortDate(occurrence)}${draft.mode === 'custom' ? '' : ` · ${formatReminderTime(parsed.hour, parsed.minute)}`}`
                    : rule.enabled ? 'Horaire à vérifier' : 'Désactivé'}
                </Text>
              </View>
              {draft.mode === 'custom' && rule.enabled && (
                <ReminderTimeInput label={`Horaire · ${rule.label}`} value={time} onChange={isEve ? setEveTime : setDayTime} disabled={saving} />
              )}
              <Switch
                accessibilityLabel={`Activer le rappel · ${rule.label}`}
                value={rule.enabled}
                disabled={draft.mode !== 'custom' || saving}
                onValueChange={enabled => setDraft(current => isEve
                  ? { ...current, customDayBeforeEnabled: enabled }
                  : { ...current, customSameDayEnabled: enabled })}
                trackColor={{ false: THEME.colors.border, true: THEME.colors.primary }}
              />
            </View>
          );
        })}
        {isLeapBirthday && <Text style={styles.secondary}>Cet anniversaire est fêté le 28 février les années non bissextiles.</Text>}
        {variableReminders && <Text style={styles.secondary}>Les rappels dont la date varie sont programmés pour {VARIABLE_REMINDER_YEARS} ans et renouvelés à l’ouverture de l’application.</Text>}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {status && <Text accessibilityLiveRegion="polite" style={styles.secondary}>{STATUS_TEXT[status]}</Text>}
        {birthday.notes && <View style={styles.notes}><Text style={styles.ruleTitle}>Note</Text><Text style={styles.secondary}>{birthday.notes}</Text></View>}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.save} accessibilityRole="button" disabled={saving} onPress={save}>
          <Text style={styles.saveText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 12 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  toolbarActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.colors.surface },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  avatar: { width: 78, height: 78, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.colors.lavender },
  initial: { color: THEME.colors.textPrimary, fontSize: 34, fontWeight: '800' },
  copy: { flex: 1 },
  name: { color: THEME.colors.textPrimary, fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  date: { color: THEME.colors.textPrimary, fontSize: 18 },
  secondary: { color: THEME.colors.textSecondary, fontSize: 14, lineHeight: 20 },
  heading: { color: THEME.colors.textPrimary, fontSize: 25, fontWeight: '800', letterSpacing: -0.4 },
  mode: { minHeight: 50, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: THEME.colors.border, backgroundColor: THEME.colors.surface },
  modeChoice: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: THEME.colors.cardBackground },
  modeText: { color: THEME.colors.textPrimary, fontSize: 16, fontWeight: '700' },
  rule: { minHeight: 70, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 1, borderColor: THEME.colors.border, backgroundColor: THEME.colors.cardBackground },
  ruleTitle: { color: THEME.colors.textPrimary, fontSize: 16, fontWeight: '800' },
  notes: { gap: 4, paddingVertical: 6 },
  error: { color: THEME.colors.danger, fontSize: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, backgroundColor: THEME.colors.background },
  save: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: THEME.colors.primary },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
