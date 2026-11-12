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
import { BirthdayProfile, ReminderMode } from '../types';
import { THEME } from '../constants/theme';
import {
  MONTH_NAMES_FR,
  getNextBirthdayDate,
  calculateNextAge,
} from '../utils/dateUtils';
import {
  CreateBirthdayInput,
  validateBirthdayInput,
  ValidationError,
} from '../database/birthdayRepository';
import { getGlobalSettings } from '../database/settingsRepository';

interface BirthdayFormModalProps {
  visible: boolean;
  editingBirthday: BirthdayProfile | null;
  onClose: () => void;
  onSave: (input: CreateBirthdayInput) => void;
}

export const BirthdayFormModal: React.FC<BirthdayFormModalProps> = ({
  visible,
  editingBirthday,
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
  const [customDayBeforeHour, setCustomDayBeforeHour] = useState('19');
  const [customSameDayEnabled, setCustomSameDayEnabled] = useState(true);
  const [customSameDayHour, setCustomSameDayHour] = useState('6');

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
      setCustomDayBeforeHour(String(editingBirthday.reminder.customDayBeforeHour));
      setCustomSameDayEnabled(editingBirthday.reminder.customSameDayEnabled);
      setCustomSameDayHour(String(editingBirthday.reminder.customSameDayHour));
    } else {
      setName('');
      setDay('');
      setMonth('1');
      setYear('');
      setNotes('');
      setReminderMode('default');
      setCustomDayBeforeEnabled(true);
      setCustomDayBeforeHour('19');
      setCustomSameDayEnabled(true);
      setCustomSameDayHour('6');
    }
    setErrors([]);
  }, [editingBirthday, visible]);

  const numDay = parseInt(day, 10);
  const numMonth = parseInt(month, 10);
  const numYear = year.trim() ? parseInt(year, 10) : undefined;

  const numDayBeforeHour = Math.min(23, Math.max(0, parseInt(customDayBeforeHour, 10) || 19));
  const numSameDayHour = Math.min(23, Math.max(0, parseInt(customSameDayHour, 10) || 6));

  const currentInput: CreateBirthdayInput = {
    name,
    birthDay: isNaN(numDay) ? 0 : numDay,
    birthMonth: isNaN(numMonth) ? 0 : numMonth,
    birthYear: numYear,
    notes,
    reminder: {
      mode: reminderMode,
      customDayBeforeEnabled,
      customDayBeforeHour: numDayBeforeHour,
      customDayBeforeMinute: 0,
      customSameDayEnabled,
      customSameDayHour: numSameDayHour,
      customSameDayMinute: 0,
    },
  };

  const hasValidDate = !isNaN(numDay) && numDay >= 1 && numDay <= 31 && !isNaN(numMonth) && numMonth >= 1 && numMonth <= 12;
  const preview = hasValidDate ? getNextBirthdayDate(numMonth, numDay) : null;
  const nextAgePreview = preview && numYear ? calculateNextAge(numYear, preview.nextDate) : null;

  const globalSettings = getGlobalSettings();

  const handleValidateAndSave = () => {
    const valErrors = validateBirthdayInput(currentInput);
    if (valErrors.length > 0) {
      setErrors(valErrors);
      return;
    }
    setErrors([]);
    onSave(currentInput);
  };

  const getFieldError = (field: ValidationError['field']) => {
    return errors.find((e) => e.field === field)?.message;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingBirthday ? 'Modifier la fiche' : 'Nouvel anniversaire'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Prénom / Surnom */}
            <Text style={styles.label}>Prénom ou surnom *</Text>
            <TextInput
              style={[styles.input, getFieldError('name') ? styles.inputError : null]}
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
              <Text style={styles.sectionHeaderTitle}>🔔 Réglage des rappels annuels</Text>

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
                  <Text style={styles.modeDescriptionText}>
                    Hérite des réglages globaux :
                    {globalSettings.dayBeforeEnabled ? ` • La veille à ${globalSettings.dayBeforeHour}h` : ''}
                    {globalSettings.sameDayEnabled ? ` • Le jour même à ${globalSettings.sameDayHour}h` : ''}
                  </Text>
                </View>
              )}

              {reminderMode === 'custom' && (
                <View style={styles.customCard}>
                  {/* Veille */}
                  <View style={styles.customRow}>
                    <View style={styles.customLabelBox}>
                      <Text style={styles.customTitle}>Rappel la veille</Text>
                      <Text style={styles.customSub}>1 jour calendaire avant</Text>
                    </View>
                    <Switch
                      value={customDayBeforeEnabled}
                      onValueChange={setCustomDayBeforeEnabled}
                      thumbColor={customDayBeforeEnabled ? THEME.colors.primary : '#ccc'}
                    />
                    {customDayBeforeEnabled && (
                      <View style={styles.hourInputBox}>
                        <TextInput
                          style={styles.hourInput}
                          keyboardType="numeric"
                          maxLength={2}
                          value={customDayBeforeHour}
                          onChangeText={setCustomDayBeforeHour}
                        />
                        <Text style={styles.hourSuffix}>h00</Text>
                      </View>
                    )}
                  </View>

                  {/* Jour même */}
                  <View style={[styles.customRow, { borderTopWidth: 1, borderTopColor: THEME.colors.borderLight, paddingTop: 8 }]}>
                    <View style={styles.customLabelBox}>
                      <Text style={styles.customTitle}>Rappel le jour même</Text>
                      <Text style={styles.customSub}>Le matin de l'anniversaire</Text>
                    </View>
                    <Switch
                      value={customSameDayEnabled}
                      onValueChange={setCustomSameDayEnabled}
                      thumbColor={customSameDayEnabled ? THEME.colors.primary : '#ccc'}
                    />
                    {customSameDayEnabled && (
                      <View style={styles.hourInputBox}>
                        <TextInput
                          style={styles.hourInput}
                          keyboardType="numeric"
                          maxLength={2}
                          value={customSameDayHour}
                          onChangeText={setCustomSameDayHour}
                        />
                        <Text style={styles.hourSuffix}>h00</Text>
                      </View>
                    )}
                  </View>
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

            {/* Aperçu dynamique du calcul de la date */}
            {preview && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>✨ Aperçu des calculs :</Text>
                <Text style={styles.previewText}>
                  • Prochaine date : {preview.isToday ? 'Aujourd’hui !' : `Dans ${preview.daysRemaining} jour(s)`}
                </Text>
                {nextAgePreview !== null && (
                  <Text style={styles.previewText}>• Âge qui sera fêté : {nextAgePreview} ans</Text>
                )}
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
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleValidateAndSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>
                {editingBirthday ? 'Enregistrer' : 'Ajouter'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  modalTitle: {
    fontSize: 18,
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
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
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
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#FAF5EE',
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
    backgroundColor: '#FCFAF7',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sectionHeaderTitle: {
    fontSize: 13,
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
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.round,
    alignItems: 'center',
    backgroundColor: '#EDE3D8',
  },
  modeTabActive: {
    backgroundColor: THEME.colors.primary,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  modeDescriptionCard: {
    backgroundColor: THEME.colors.surface,
    padding: 8,
    borderRadius: THEME.borderRadius.sm,
  },
  modeDescriptionText: {
    fontSize: 11,
    color: THEME.colors.textPrimary,
  },
  customCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.sm,
    padding: 8,
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
  customSub: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
  },
  hourInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  hourInput: {
    width: 36,
    height: 32,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.sm,
    textAlign: 'center',
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  hourSuffix: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginLeft: 2,
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
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surface,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.primary,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
