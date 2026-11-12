import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { GlobalReminderSettings, PermissionReport } from '../types';
import { THEME } from '../constants/theme';
import {
  getGlobalSettings,
  saveGlobalSettings,
} from '../database/settingsRepository';
import { syncAllDefaultInheritedReminders } from '../services/reminderScheduler';

interface GlobalSettingsSectionProps {
  permission: PermissionReport | null;
  onRequestPermission: () => void;
  defaultProfilesCount: number;
  onRefreshAll: () => Promise<void>;
  onLogEvent?: (type: 'scheduled' | 'received' | 'response' | 'cancelled' | 'error', title: string, details: string) => void;
}

export const GlobalSettingsSection: React.FC<GlobalSettingsSectionProps> = ({
  permission,
  onRequestPermission,
  defaultProfilesCount,
  onRefreshAll,
  onLogEvent,
}) => {
  const [settings, setSettings] = useState<GlobalReminderSettings>(getGlobalSettings());
  const [dayBeforeHour, setDayBeforeHour] = useState(String(settings.dayBeforeHour));
  const [sameDayHour, setSameDayHour] = useState(String(settings.sameDayHour));

  useEffect(() => {
    const s = getGlobalSettings();
    setSettings(s);
    setDayBeforeHour(String(s.dayBeforeHour));
    setSameDayHour(String(s.sameDayHour));
  }, []);

  const handleSave = async () => {
    const numEve = Math.min(23, Math.max(0, parseInt(dayBeforeHour, 10) || 19));
    const numDay = Math.min(23, Math.max(0, parseInt(sameDayHour, 10) || 6));

    const updated: GlobalReminderSettings = {
      ...settings,
      dayBeforeHour: numEve,
      sameDayHour: numDay,
    };

    saveGlobalSettings(updated);
    setSettings(updated);

    // Reprogrammer uniquement les fiches qui en héritent
    const count = await syncAllDefaultInheritedReminders(updated);
    onLogEvent?.(
      'scheduled',
      'Réglages globaux mis à jour',
      `Nouvelles valeurs (Veille ${numEve}h / Jour J ${numDay}h). ${count} fiche(s) reprogrammée(s).`
    );

    await onRefreshAll();

    Alert.alert(
      'Réglages enregistrés',
      `Les rappels par défaut ont été enregistrés.\n\n${count} fiche(s) héritant de ces réglages ont été automatiquement reprogrammées dans Android.`
    );
  };

  const isGranted = permission?.granted ?? false;

  return (
    <View style={styles.container}>
      {/* 1. État des autorisations */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>Autorisations Android</Text>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: isGranted ? THEME.colors.successBg : THEME.colors.warningBg },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isGranted ? THEME.colors.success : THEME.colors.warning },
              ]}
            >
              {isGranted ? '✓ Accordées' : '⚠ Non accordées'}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>
          {isGranted
            ? 'L’application peut envoyer les alertes même avec l’écran éteint.'
            : 'Sans autorisation, Android bloquera l’arrivée des rappels d’anniversaire.'}
        </Text>

        {!isGranted && (
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={onRequestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionBtnText}>🔔 Accorder l’autorisation</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Rappels par défaut */}
      <View style={[styles.card, { marginTop: THEME.spacing.md }]}>
        <Text style={styles.cardTitle}>Rappels par défaut du système</Text>
        <Text style={styles.subtitle}>
          Ces horaires s'appliquent automatiquement à toutes les fiches en mode « Par défaut ».
        </Text>

        {/* Veille */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Rappel la veille</Text>
            <Text style={styles.settingSub}>1 jour calendaire avant (ex: 1er fév. pour le 2 fév.)</Text>
          </View>
          <Switch
            value={settings.dayBeforeEnabled}
            onValueChange={(val) => setSettings({ ...settings, dayBeforeEnabled: val })}
            thumbColor={settings.dayBeforeEnabled ? THEME.colors.primary : '#ccc'}
          />
          {settings.dayBeforeEnabled && (
            <View style={styles.timeBox}>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                maxLength={2}
                value={dayBeforeHour}
                onChangeText={setDayBeforeHour}
              />
              <Text style={styles.timeSuffix}>h00</Text>
            </View>
          )}
        </View>

        {/* Jour même */}
        <View style={[styles.settingRow, styles.settingRowBorder]}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Rappel le jour même</Text>
            <Text style={styles.settingSub}>Le matin même de l'anniversaire</Text>
          </View>
          <Switch
            value={settings.sameDayEnabled}
            onValueChange={(val) => setSettings({ ...settings, sameDayEnabled: val })}
            thumbColor={settings.sameDayEnabled ? THEME.colors.primary : '#ccc'}
          />
          {settings.sameDayEnabled && (
            <View style={styles.timeBox}>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                maxLength={2}
                value={sameDayHour}
                onChangeText={setSameDayHour}
              />
              <Text style={styles.timeSuffix}>h00</Text>
            </View>
          )}
        </View>

        <View style={styles.inheritBox}>
          <Text style={styles.inheritText}>
            📌 <Text style={{ fontWeight: '700' }}>{defaultProfilesCount} fiche(s)</Text> héritent actuellement de ces réglages.
          </Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>💾 Enregistrer & reprogrammer les fiches</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
  },
  card: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.md,
    lineHeight: 15,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.round,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 8,
  },
  permissionBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    marginTop: 4,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  settingSub: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  timeInput: {
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
  timeSuffix: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginLeft: 2,
  },
  inheritBox: {
    backgroundColor: '#FAF5EE',
    padding: 8,
    borderRadius: THEME.borderRadius.sm,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  inheritText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
