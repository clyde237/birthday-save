import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, BellRing, Check, ChevronRight, CircleAlert, Clock3, RotateCw, ShieldCheck } from 'lucide-react-native';
import type { PermissionReport } from '../types';
import type { ReminderStatus } from '../services/reminderScheduler';
import { THEME } from '../constants/theme';

interface Props {
  permission: PermissionReport | null;
  reminderStatuses: Record<string, ReminderStatus>;
  birthdayCount: number;
  syncFailed: boolean;
  sendingCheck: boolean;
  onRefresh: () => void;
  onRequestPermission: () => void;
  onRequestExactAlarm: () => void;
  onSendCheck: () => void;
}

export function NotificationDiagnosticsSection({
  permission,
  reminderStatuses,
  birthdayCount,
  syncFailed,
  sendingCheck,
  onRefresh,
  onRequestPermission,
  onRequestExactAlarm,
  onSendCheck,
}: Props) {
  const notificationsEnabled = permission?.granted ?? false;
  const reminderCount = Object.values(reminderStatuses).filter(
    status => status === 'scheduled' || status === 'approximate'
  ).length;
  const statusColor = notificationsEnabled ? THEME.colors.success : THEME.colors.warning;
  const statusBackground = notificationsEnabled ? THEME.colors.successBg : THEME.colors.warningBg;
  const permissionActionLabel = permission?.canAskAgain && !permission.channelBlocked
    ? 'Autoriser les notifications'
    : 'Ouvrir les réglages des notifications';

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <View style={[styles.statusIcon, { backgroundColor: statusBackground }]}>
          {notificationsEnabled
            ? <BellRing size={24} color={statusColor} />
            : <Bell size={24} color={statusColor} />}
        </View>
        <View style={styles.statusCopy}>
          <Text style={styles.eyebrow}>État de l’appareil</Text>
          <Text accessibilityLiveRegion="polite" style={styles.statusTitle}>
            {permission === null
              ? syncFailed ? 'Diagnostic indisponible' : 'Vérification en cours…'
              : permission.isExpoGo
                ? notificationsEnabled ? 'Notifications activées' : 'Notifications à autoriser'
              : permission.channelBlocked
                ? 'Canal de rappels désactivé'
                : notificationsEnabled
                  ? 'Notifications activées'
                  : 'Notifications à autoriser'}
          </Text>
          <Text style={styles.description}>
            {permission === null
              ? syncFailed
                ? 'L’état des notifications n’a pas pu être lu. Actualisez pour réessayer.'
                : 'Actualisez cette page si cet état persiste.'
              : permission.channelBlocked
                ? 'Le canal des rappels est désactivé dans les réglages Android.'
                : notificationsEnabled
                  ? 'Birthday-save peut envoyer les rappels sur cet appareil.'
                  : 'Autorisez les notifications pour recevoir les rappels d’anniversaire.'}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Actualiser le diagnostic"
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <RotateCw size={18} color={THEME.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Autorisations et rappels</Text>
        <StatusRow
          icon={<ShieldCheck size={18} color={THEME.colors.primary} />}
          label="Notifications"
          value={permission === null ? 'Vérification en cours' : notificationsEnabled ? 'Autorisées' : 'Non autorisées'}
          positive={notificationsEnabled}
          pending={permission === null}
        />
        {Platform.OS === 'android' && (
          <>
            <StatusRow
              icon={<Bell size={18} color={THEME.colors.primary} />}
              label="Canal des rappels"
              value={permission?.isExpoGo
                ? 'Disponible'
                : permission?.channelBlocked
                  ? 'Désactivé'
                  : permission?.androidImportance != null
                    ? 'Disponible'
                    : 'Indisponible'}
              positive={!!permission && (permission.isExpoGo || (!permission.channelBlocked && permission.androidImportance != null))}
              pending={permission === null || (!permission.isExpoGo && !permission.channelBlocked && permission.androidImportance == null)}
            />
            <StatusRow
              icon={<Clock3 size={18} color={THEME.colors.primary} />}
              label="Alarmes exactes"
              value={permission?.isExpoGo
                ? 'À confirmer sur cet appareil'
                : permission?.exactAlarms == null
                  ? 'État inconnu'
                  : permission.exactAlarms
                    ? 'Autorisées'
                    : 'À autoriser'}
              positive={permission?.exactAlarms === true}
              pending={permission === null || (!permission.isExpoGo && permission.exactAlarms == null)}
              last
            />
          </>
        )}
        {Platform.OS !== 'android' && (
          <StatusRow
            icon={<Clock3 size={18} color={THEME.colors.primary} />}
            label="Planification des rappels"
            value={notificationsEnabled ? 'Disponible' : 'En attente d’autorisation'}
            positive={notificationsEnabled}
            last
          />
        )}
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Rappels d’anniversaire</Text>
        <Text style={styles.description}>
          {syncFailed
            ? 'La synchronisation des rappels a rencontré un problème. Actualisez pour réessayer.'
            : `${reminderCount} fiche${reminderCount > 1 ? 's' : ''} avec des rappels programmés sur ${birthdayCount} anniversaire${birthdayCount > 1 ? 's' : ''}.`}
        </Text>
        {syncFailed && (
          <View style={styles.syncWarning}>
            <CircleAlert size={18} color={THEME.colors.warning} />
            <Text style={styles.syncWarningText}>Certains rappels n’ont pas pu être mis à jour.</Text>
          </View>
        )}
      </View>

      {!notificationsEnabled && permission !== null && (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={onRequestPermission}
          activeOpacity={0.82}
        >
          <Bell size={19} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{permissionActionLabel}</Text>
          <ChevronRight size={19} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {notificationsEnabled && Platform.OS === 'android' && !permission?.isExpoGo && permission?.exactAlarms === false && (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.secondaryButton}
          onPress={onRequestExactAlarm}
          activeOpacity={0.82}
        >
          <Clock3 size={19} color={THEME.colors.primary} />
          <Text style={styles.secondaryButtonText}>Autoriser les alarmes exactes</Text>
          <ChevronRight size={19} color={THEME.colors.primary} />
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Vérifier la réception</Text>
        <Text style={styles.description}>
          Envoyez une notification maintenant pour vérifier qu’elle s’affiche sur cet appareil.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: !notificationsEnabled || sendingCheck }}
          style={[styles.checkButton, (!notificationsEnabled || sendingCheck) && styles.disabledButton]}
          onPress={onSendCheck}
          disabled={!notificationsEnabled || sendingCheck}
          activeOpacity={0.82}
        >
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {sendingCheck ? 'Envoi en cours…' : 'Envoyer une notification de vérification'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footnote}>
        Les rappels sont programmés sur l’appareil et ne nécessitent pas de connexion Internet.
      </Text>
    </View>
  );
}

function StatusRow({
  icon,
  label,
  value,
  positive,
  pending = false,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  positive: boolean;
  pending?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.statusRow, last && styles.lastStatusRow]}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValue}>
        {pending ? null : positive
          ? <Check size={15} color={THEME.colors.success} />
          : <CircleAlert size={15} color={THEME.colors.warning} />}
        <Text style={[styles.rowValueText, pending ? styles.pendingText : positive ? styles.positiveText : styles.warningText]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginTop: 16, gap: 14, paddingBottom: 24 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statusIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1, gap: 3 },
  eyebrow: { color: THEME.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  statusTitle: { color: THEME.colors.textPrimary, fontSize: 17, fontWeight: '800' },
  description: { color: THEME.colors.textSecondary, fontSize: 14, lineHeight: 20 },
  refreshButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  cardTitle: { color: THEME.colors.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 2 },
  statusRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  lastStatusRow: { borderBottomWidth: 0 },
  rowIcon: { width: 24, alignItems: 'center' },
  rowLabel: { flex: 1, color: THEME.colors.textPrimary, fontSize: 14, fontWeight: '600' },
  rowValue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  rowValueText: { fontSize: 12, fontWeight: '700' },
  positiveText: { color: THEME.colors.success },
  warningText: { color: THEME.colors.warning },
  pendingText: { color: THEME.colors.textSecondary },
  syncWarning: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  syncWarningText: { flex: 1, color: THEME.colors.warning, fontSize: 13, fontWeight: '600' },
  primaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: THEME.colors.primary,
  },
  primaryButtonText: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  secondaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  secondaryButtonText: { flex: 1, color: THEME.colors.primaryDark, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  checkButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: THEME.colors.primary,
    marginTop: 4,
  },
  disabledButton: { backgroundColor: THEME.colors.textSecondary },
  footnote: { paddingHorizontal: 4, color: THEME.colors.textSecondary, fontSize: 12, lineHeight: 18 },
});
