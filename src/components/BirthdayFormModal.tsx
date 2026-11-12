import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import type { BirthdayProfile, GlobalReminderSettings, ReminderMode } from '../types';
import { ReminderTimeInput } from './ReminderTimeInput';
import { formatReminderTime, getEffectiveReminderSettings, getReminderRules, parseReminderTime } from '../utils/reminderRules';
import { THEME } from '../constants/theme';
import {
  MONTH_NAMES_FR,
  getNextBirthdayDate,
  calculateNextAge,
  getNextReminderOccurrence,
} from '../utils/dateUtils';
import {
  CreateBirthdayInput,
  validateBirthdayInput,
  ValidationError,
} from '../utils/birthdayValidation';

interface BirthdayFormModalProps {
  visible: boolean;
  editingBirthday: BirthdayProfile | null;
  defaults: GlobalReminderSettings;
  saving: boolean;
  onClose: () => void;
  onSave: (input: CreateBirthdayInput) => void;
}

export const BirthdayFormModal: React.FC<BirthdayFormModalProps> = ({
  visible,
  editingBirthday,
  defaults,
  saving,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('1');
  const [year, setYear] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderMode, setReminderMode] = useState<ReminderMode>('default');

  // Réglages personnalisés
  const [customDayBeforeEnabled, setCustomDayBeforeEnabled] = useState(true);
  const [customDayBeforeHour, setCustomDayBeforeHour] = useState('19:00');
  const [customSameDayEnabled, setCustomSameDayEnabled] = useState(true);
  const [customSameDayHour, setCustomSameDayHour] = useState('06:00');

  const [errors, setErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    if (editingBirthday) {
      setName(editingBirthday.name);
      setDay(String(editingBirthday.birthDay));
      setMonth(String(editingBirthday.birthMonth));
      setYear(editingBirthday.birthYear ? String(editingBirthday.birthYear) : '');
      setNotes(editingBirthday.notes || '');
      setReminderMode(editingBirthday.reminder.mode);
      setCustomDayBeforeEnabled(editingBirthday.reminder.customDayBeforeEnabled);
      setCustomDayBeforeHour(formatReminderTime(editingBirthday.reminder.customDayBeforeHour, editingBirthday.reminder.customDayBeforeMinute));
      setCustomSameDayEnabled(editingBirthday.reminder.customSameDayEnabled);
      setCustomSameDayHour(formatReminderTime(editingBirthday.reminder.customSameDayHour, editingBirthday.reminder.customSameDayMinute));
    } else {
      setName('');
      setDay('');
      setMonth('1');
      setYear('');
      setNotes('');
      setReminderMode('default');
      setCustomDayBeforeEnabled(true);
      setCustomDayBeforeHour('19:00');
      setCustomSameDayEnabled(true);
      setCustomSameDayHour('06:00');
    }
    setErrors([]);
  }, [editingBirthday, visible]);

  const numDay = /^\d{1,2}$/.test(day.trim()) ? Number(day) : NaN;
  const numMonth = parseInt(month, 10);
  const numYear = !year.trim() ? undefined : /^\d{4}$/.test(year.trim()) ? Number(year) : NaN;

  const eve = parseReminderTime(customDayBeforeHour);
  const sameDay = parseReminderTime(customSameDayHour);
  const reminder = {
    mode: reminderMode,
    customDayBeforeEnabled,
    customDayBeforeHour: eve?.hour ?? editingBirthday?.reminder.customDayBeforeHour ?? 19,
    customDayBeforeMinute: eve?.minute ?? editingBirthday?.reminder.customDayBeforeMinute ?? 0,
    customSameDayEnabled,
    customSameDayHour: sameDay?.hour ?? editingBirthday?.reminder.customSameDayHour ?? 6,
    customSameDayMinute: sameDay?.minute ?? editingBirthday?.reminder.customSameDayMinute ?? 0,
  };
  const currentInput: CreateBirthdayInput = {
    name, birthDay: numDay, birthMonth: numMonth, birthYear: numYear, notes, reminder,
  };
  const dateIsValid = validateBirthdayInput(currentInput).every(error => error.field === 'name');
  const preview = dateIsValid ? getNextBirthdayDate(numMonth, numDay) : null;
  const nextAgePreview = preview ? calculateNextAge(numYear, preview.nextDate) : null;
  const hasInvalidReminder = reminderMode === 'custom' &&
    ((customDayBeforeEnabled && !eve) || (customSameDayEnabled && !sameDay));

  const handleValidateAndSave = () => {
    if (saving) return;
    const valErrors = validateBirthdayInput(currentInput);
    if (hasInvalidReminder) valErrors.push({ field: 'reminder', message: 'Saisissez un horaire entre 00:00 et 23:59.' });
    setErrors(valErrors);
    if (valErrors.length === 0) onSave(currentInput);
  };

  const getFieldError = (field: ValidationError['field']) => {
    return errors.find((e) => e.field === field)?.message;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={() => { if (!saving) onClose(); }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingBirthday ? 'Modifier la fiche' : 'Nouvel anniversaire'}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={saving} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Prénom / Surnom */}
            <Text style={styles.label}>Prénom ou surnom *</Text>
            <TextInput
              style={[styles.input, getFieldError('name') ? styles.inputError : null]}
              accessibilityLabel="Prénom ou surnom"
              placeholder="Ex : Maman, Sophie, Lucas..."
              placeholderTextColor="#A09398"
              value={name}
              onChangeText={setName}
            />
            {getFieldError('name') && (
              <Text style={styles.errorText}>⚠ {getFieldError('name')}</Text>
            )}

            {/* Date : Jour et Mois */}
            <View style={styles.row}>
              <View style={styles.colDay}>
                <Text style={styles.label}>Jour *</Text>
                <TextInput
                  style={[styles.input, getFieldError('birthDay') ? styles.inputError : null]}
                  accessibilityLabel="Jour de naissance"
                  placeholder="1 - 31"
                  placeholderTextColor="#A09398"
                  keyboardType="numeric"
                  maxLength={2}
                  value={day}
                  onChangeText={setDay}
                />
              </View>

              <View style={styles.colMonth}>
                <Text style={styles.label}>Mois *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
                  {MONTH_NAMES_FR.map((mName, idx) => {
                    const mVal = String(idx + 1);
                    const isSelected = month === mVal;
                    return (
                      <TouchableOpacity
                        key={mVal}
                        accessibilityRole="button"
                        accessibilityLabel={mName}
                        accessibilityState={{ selected: isSelected }}
                        style={[styles.monthPill, isSelected ? styles.monthPillActive : null]}
                        onPress={() => setMonth(mVal)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.monthPillText, isSelected ? styles.monthPillTextActive : null]}>
                          {mName.substring(0, 4)}.
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
            {(getFieldError('birthDay') || getFieldError('birthMonth')) && (
              <Text style={styles.errorText}>
                ⚠ {getFieldError('birthDay') || getFieldError('birthMonth')}
              </Text>
            )}

            {/* Année facultative */}
            <Text style={styles.label}>Année de naissance (facultative)</Text>
            <TextInput
              style={[styles.input, getFieldError('birthYear') ? styles.inputError : null]}
              accessibilityLabel="Année de naissance"
              placeholder="Ex : 1985 (permet de calculer l'âge)"
              placeholderTextColor="#A09398"
              keyboardType="numeric"
              maxLength={4}
              value={year}
              onChangeText={setYear}
            />
            {getFieldError('birthYear') && (
              <Text style={styles.errorText}>⚠ {getFieldError('birthYear')}</Text>
            )}

            {/* SECTION RAPPELS (LOT 3) */}
            <View style={styles.reminderSection}>
              <Text style={styles.sectionHeaderTitle}>Rappels annuels</Text>

              {/* Mode switch */}
              <View style={styles.modeTabsRow}>
                <TouchableOpacity
                  style={[styles.modeTab, reminderMode === 'default' ? styles.modeTabActive : null]}
                  onPress={() => setReminderMode('default')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeTabText, reminderMode === 'default' ? styles.modeTabTextActive : null]}>
                    Par défaut
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeTab, reminderMode === 'custom' ? styles.modeTabActive : null]}
                  onPress={() => setReminderMode('custom')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeTabText, reminderMode === 'custom' ? styles.modeTabTextActive : null]}>
                    Personnalisé
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeTab, reminderMode === 'disabled' ? styles.modeTabActive : null]}
                  onPress={() => setReminderMode('disabled')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeTabText, reminderMode === 'disabled' ? styles.modeTabTextActive : null]}>
                    Désactivé
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Contenu selon le mode */}
              {reminderMode === 'default' && (
                <View style={styles.modeDescriptionCard}>
                  <Text style={styles.modeDescriptionText}>Utilise les horaires définis dans Paramètres.</Text>
                </View>
              )}
              {reminderMode === 'custom' && (
                <View style={styles.customCard}>
                  {[
                    { label: 'La veille', enabled: customDayBeforeEnabled, toggle: setCustomDayBeforeEnabled, time: customDayBeforeHour, setTime: setCustomDayBeforeHour },
                    { label: 'Le jour même', enabled: customSameDayEnabled, toggle: setCustomSameDayEnabled, time: customSameDayHour, setTime: setCustomSameDayHour },
                  ].map(({ label, enabled, toggle, time, setTime }) => (
                    <View key={label} style={styles.customRow}>
                      <View style={styles.customLabelBox}><Text style={styles.customTitle}>{label}</Text></View>
                      {enabled && <ReminderTimeInput label={`Horaire · ${label}`} value={time} onChange={setTime} disabled={saving} />}
                      <Switch
                        value={enabled} onValueChange={toggle} disabled={saving}
                        accessibilityLabel={`Activer le rappel · ${label}`}
                        trackColor={{ false: THEME.colors.border, true: THEME.colors.primary }}
                      />
                    </View>
                  ))}
                  {!!getFieldError('reminder') && <Text accessibilityRole="alert" style={styles.errorText}>{getFieldError('reminder')}</Text>}
                </View>
              )}

              {reminderMode === 'disabled' && (
                <View style={[styles.modeDescriptionCard, { backgroundColor: '#F3EFEA' }]}>
                  <Text style={styles.modeDescriptionText}>
                    Aucune notification ne sera programmée pour cette fiche.
                  </Text>
                </View>
              )}
            </View>

            {preview && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>Prochain anniversaire</Text>
                <Text style={styles.previewText}>
                  {preview.isToday ? 'Aujourd’hui' : preview.nextDate.toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                  {nextAgePreview !== null ? ` · ${nextAgePreview} ans` : ''}
                </Text>
                {!hasInvalidReminder && getReminderRules(getEffectiveReminderSettings(reminder, defaults))
                  .filter(rule => rule.enabled).map(rule => {
                    const date = getNextReminderOccurrence(numMonth, numDay, rule.type, rule.hour, rule.minute);
                    return (
                      <Text key={rule.type} style={styles.previewText}>
                        {rule.label} · {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {formatReminderTime(rule.hour, rule.minute)}
                      </Text>
                    );
                  })}
              </View>
            )}

            {/* Note / Idée cadeau */}
            <Text style={styles.label}>Note ou idée de cadeau (facultative)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Idée de cadeau, livre préféré, parfum..."
              placeholderTextColor="#A09398"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleValidateAndSave} disabled={saving} accessibilityRole="button" activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>
                {saving ? 'Enregistrement…' : editingBirthday ? 'Enregistrer' : 'Ajouter'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(49, 18, 38, 0.38)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.round,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  formScroll: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    borderRadius: 15,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  inputError: {
    borderColor: THEME.colors.danger,
    backgroundColor: THEME.colors.dangerBg,
  },
  errorText: {
    fontSize: 11,
    color: THEME.colors.danger,
    fontWeight: '600',
    marginTop: 3,
  },
  row: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginTop: 4,
  },
  colDay: {
    width: 80,
  },
  colMonth: {
    flex: 1,
  },
  monthScroll: {
    flexDirection: 'row',
    marginTop: 2,
  },
  monthPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginRight: 6,
  },
  monthPillActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  monthPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  monthPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reminderSection: {
    marginTop: THEME.spacing.md,
    backgroundColor: '#FFF5F0',
    padding: THEME.spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 13,
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
  modeTabActive: {
    backgroundColor: THEME.colors.primary,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  modeDescriptionCard: {
    backgroundColor: THEME.colors.surface,
    padding: 11,
    borderRadius: 13,
  },
  modeDescriptionText: {
    fontSize: 11,
    color: THEME.colors.textPrimary,
  },
  customCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  customLabelBox: {
    flex: 1,
  },
  customTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  previewBox: {
    backgroundColor: '#F3F9F1',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.success,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: THEME.colors.surface,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    minHeight: 50,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: THEME.colors.primary,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
