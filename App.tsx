import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScrollView,
  AppState,
  BackHandler,
  Linking,
  StyleSheet,
  Alert,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { CalendarDays, CalendarRange, Plus, Settings2 } from 'lucide-react-native';
import { PermissionCard } from './src/components/PermissionCard';
import { QuickTestSection } from './src/components/QuickTestSection';
import { ScheduledListSection } from './src/components/ScheduledListSection';
import { EventLogSection } from './src/components/EventLogSection';
import { ValidationGuide } from './src/components/ValidationGuide';
import { GlobalSettingsSection } from './src/components/GlobalSettingsSection';
import { UpcomingSection } from './src/components/UpcomingSection';
import { CalendarSection } from './src/components/CalendarSection';
import { ProfileDetailView } from './src/components/ProfileDetailView';
import { BirthdayFormModal } from './src/components/BirthdayFormModal';
import { LaunchScreen } from './src/components/LaunchScreen';
import { THEME } from './src/constants/theme';
import {
  PermissionReport,
  ScheduledNotificationInfo,
  NotificationLogItem,
  BirthdayProfile,
  GlobalReminderSettings,
} from './src/types';
import {
  setupNotificationChannel,
  getNotificationPermissions,
  requestNotificationPermissions,
  triggerImmediateNotification,
  scheduleShortTermReminder,
  scheduleYearlyReminder,
  scheduleMamanReferenceScenario,
  getScheduledNotificationsList,
  cancelNotification,
} from './src/services/notificationService';
import {
  getAllBirthdays,
  deleteBirthday,
  CreateBirthdayInput,
  createBirthday,
  updateBirthday,
} from './src/database/birthdayRepository';
import { reconcileBirthdayReminders, type ReminderStatus } from './src/services/reminderScheduler';
import { DEFAULT_GLOBAL_SETTINGS, getGlobalSettings, saveGlobalSettings } from './src/database/settingsRepository';
import { getEffectiveReminderSettings, getReminderRules } from './src/utils/reminderRules';

// Keep the native surface in place until the branded React Native screen is painted.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

type ActiveTab = 'upcoming' | 'calendar' | 'settings' | 'testbench';

const TABS = [
  { key: 'upcoming', label: 'À venir', Icon: CalendarDays },
  { key: 'calendar', label: 'Calendrier', Icon: CalendarRange },
  { key: 'settings', label: 'Paramètres', Icon: Settings2 },
] as const;

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [birthdays, setBirthdays] = useState<BirthdayProfile[]>([]);
  const [globalSettings, setGlobalSettings] = useState(DEFAULT_GLOBAL_SETTINGS);
  const [permission, setPermission] = useState<PermissionReport | null>(null);
  const [reminderStatuses, setReminderStatuses] = useState<Record<string, ReminderStatus>>({});
  const [storageError, setStorageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [launchShown, setLaunchShown] = useState(false);
  const markLaunchShown = useCallback(() => setLaunchShown(true), []);
  const [syncFailed, setSyncFailed] = useState(false);
  const [scheduledList, setScheduledList] = useState<ScheduledNotificationInfo[]>([]);
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState<BirthdayProfile | null>(null);

  const mutationInProgress = useRef(false);
  const refreshVersion = useRef(0);
  const handledNotificationResponse = useRef<string | null>(null);
  const selectedProfile = birthdays.find(profile => profile.id === selectedProfileId);
  // A queue refresh can update notification IDs without changing the editable fields.
  const selectedReminder = selectedProfile?.reminder;
  const profileKey = selectedProfile && JSON.stringify([
    selectedProfile.id, selectedReminder?.mode,
    selectedReminder?.customDayBeforeEnabled, selectedReminder?.customDayBeforeHour, selectedReminder?.customDayBeforeMinute,
    selectedReminder?.customSameDayEnabled, selectedReminder?.customSameDayHour, selectedReminder?.customSameDayMinute,
  ]);

  const addLog = useCallback((type: NotificationLogItem['type'], title: string, details: string) => {
    const newLog: NotificationLogItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      type,
      title,
      details,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  const refreshState = useCallback(async (removedIds: readonly string[] = []) => {
    const version = ++refreshVersion.current;
    try {
      const profiles = await getAllBirthdays();
      const defaults = getGlobalSettings();
      if (version === refreshVersion.current) {
        setBirthdays(profiles);
        setGlobalSettings(defaults);
        setStorageError(false);
        setLoading(false);
      }
    } catch {
      if (version === refreshVersion.current) {
        setStorageError(true);
        setLoading(false);
      }
      return false;
    }

    try {
      await setupNotificationChannel();
      const nextPermission = await getNotificationPermissions();
      if (version === refreshVersion.current) setPermission(nextPermission);
      const statuses = await reconcileBirthdayReminders(removedIds);
      const diagnosticList = __DEV__ ? await getScheduledNotificationsList(true) : [];
      if (version === refreshVersion.current) {
        setReminderStatuses(statuses);
        setSyncFailed(false);
        setScheduledList(diagnosticList);
      }
      return true;
    } catch {
      if (version === refreshVersion.current) {
        setReminderStatuses({});
        setSyncFailed(true);
      }
      return false;
    }
  }, []);

  const handleNotificationResponse = useCallback(async (response: Notifications.NotificationResponse) => {
    const { request, date } = response.notification;
    const responseKey = `${request.identifier}:${response.actionIdentifier}:${date}`;
    if (handledNotificationResponse.current === responseKey) return;
    handledNotificationResponse.current = responseKey;

    try {
      const profileId = request.content.data?.profileId;
      if (typeof profileId === 'string') {
        const profiles = await getAllBirthdays();
        setBirthdays(profiles);
        setActiveTab('upcoming');
        setFormModalVisible(false);
        setSelectedProfileId(profiles.some(profile => profile.id === profileId) ? profileId : null);
      }
      await Notifications.clearLastNotificationResponseAsync();
    } catch {
      addLog('error', 'Ouverture de la notification', 'La fiche n’a pas pu être ouverte.');
    }
    await refreshState();
  }, [addLog, refreshState]);

  useEffect(() => {
    let mounted = true;
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      void handleNotificationResponse(response);
    });
    const stateListener = AppState.addEventListener('change', state => {
      if (state === 'active' && !mutationInProgress.current) void refreshState();
    });
    const notificationListener = __DEV__ ? Notifications.addNotificationReceivedListener(notification => {
      addLog('received', notification.request.content.title ?? 'Notification reçue', 'Reçue au premier plan.');
    }) : undefined;

    void refreshState();
    void Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (response && mounted) return handleNotificationResponse(response);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
      refreshVersion.current++;
      responseListener.remove();
      stateListener.remove();
      notificationListener?.remove();
    };
  }, [addLog, handleNotificationResponse, refreshState]);

  useEffect(() => {
    if (!selectedProfileId && activeTab !== 'testbench') return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedProfileId) setSelectedProfileId(null);
      else setActiveTab('settings');
      return true;
    });
    return () => listener.remove();
  }, [activeTab, selectedProfileId]);

  const handlePullRefresh = async () => {
    setRefreshing(true);
    await refreshState();
    setRefreshing(false);
  };

  const handleRequestPermission = async () => {
    try {
      const current = await getNotificationPermissions();
      if (!current.canAskAgain && !current.granted) await Linking.openSettings();
      else await requestNotificationPermissions();
      await refreshState();
    } catch {
      Alert.alert('Notifications', 'Impossible d’ouvrir les réglages de notification.');
    }
  };

  const handleRequestExactAlarm = async () => {
    try {
      await Notifications.requestExactAlarmPermissionsAsync();
      await refreshState();
    } catch {
      Alert.alert('Alarmes exactes', 'Impossible d’ouvrir les réglages des alarmes sur cet appareil.');
    }
  };

  // ----- Handlers du banc d'essai -----

  const handleImmediateTest = async () => {
    try {
      const id = await triggerImmediateNotification();
      addLog('scheduled', 'Test immédiat déclenché', `Notification envoyée (ID: ${id})`);
    } catch (err: any) {
      addLog('error', 'Erreur test immédiat', err?.message || String(err));
    }
  };

  const handleScheduleShortTerm = async (seconds: number) => {
    try {
      const id = await scheduleShortTermReminder(
        seconds,
        `🎂 Test court terme (${seconds}s)`,
        `Rappel reçu avec succès ! (Écran verrouillé / hors ligne testé)`
      );
      addLog('scheduled', `Rappel ${seconds}s programmé`, `ID: ${id}. Prévu dans ${seconds}s. Verrouillez l'écran !`);
      await refreshState();
      Alert.alert(
        'Rappel programmé !',
        `Notification prévue dans ${seconds} secondes.\n\n👉 Vous pouvez maintenant verrouiller votre écran ou passer en mode avion pour valider la réception.`
      );
    } catch (err: any) {
      addLog('error', `Erreur programmation ${seconds}s`, err?.message || String(err));
    }
  };

  const handleScheduleMamanScenario = async () => {
    try {
      const { idEve, idDay } = await scheduleMamanReferenceScenario();
      addLog('scheduled', 'Scénario Maman programmé', `2 rappels créés. Veille: ${idEve} (1er fév à 19h), Jour J: ${idDay} (2 fév à 06h).`);
      await refreshState();
      Alert.alert(
        'Scénario de référence validé',
        '2 déclencheurs annuels ont été programmés dans Android :\n\n• 1er février à 19h00 (la veille)\n• 2 février à 06h00 (le jour même)\n\nIls se déclencheront chaque année automatiquement.'
      );
    } catch (err: any) {
      addLog('error', 'Erreur scénario Maman', err?.message || String(err));
    }
  };

  const handleScheduleNearYearlyTest = async () => {
    try {
      const now = new Date();
      const targetDate = new Date(now.getTime() + 2 * 60 * 1000);
      const targetMonthHuman = targetDate.getMonth() + 1;
      const targetDay = targetDate.getDate();
      const targetHour = targetDate.getHours();
      const targetMinute = targetDate.getMinutes();

      const id = await scheduleYearlyReminder(
        'Test Proche (Annuel)',
        targetMonthHuman,
        targetDay,
        'same_day',
        targetHour,
        targetMinute,
        'bestEffort'
      );

      addLog(
        'scheduled',
        'Déclencheur annuel proche créé',
        `Prévu pour aujourd'hui à ${targetHour}h${String(targetMinute).padStart(2, '0')} (ID: ${id}).`
      );
      await refreshState();
      Alert.alert(
        'Déclencheur annuel proche créé',
        `Programmé pour aujourd'hui à ${targetHour}h${String(targetMinute).padStart(2, '0')} (dans ~2 minutes).\n\nLaissez le téléphone se verrouiller pour observer l'arrivée de la récurrence annuelle.`
      );
    } catch (err: any) {
      addLog('error', 'Erreur trigger annuel proche', err?.message || String(err));
    }
  };

  const handleCancelOne = async (id: string) => {
    try {
      await cancelNotification(id);
      addLog('cancelled', 'Notification annulée', `Rappel ${id} supprimé.`);
      await refreshState();
    } catch (err: any) {
      addLog('error', 'Erreur annulation', err?.message || String(err));
    }
  };

  const handleCancelAll = async () => {
    try {
      const testNotifications = await getScheduledNotificationsList(true);
      await Promise.all(testNotifications.map(({ id }) => cancelNotification(id)));
      addLog('cancelled', 'Notifications de test annulées', 'Les rappels d’anniversaire sont conservés.');
      await refreshState();
    } catch (err: any) {
      addLog('error', 'Erreur annulation globale', err?.message || String(err));
    }
  };

  const handleOpenProfile = (birthday: BirthdayProfile) => setSelectedProfileId(birthday.id);
  const handleOpenAddForm = () => {
    setEditingBirthday(null);
    setFormModalVisible(true);
  };
  const handleOpenEditForm = (birthday: BirthdayProfile) => {
    setEditingBirthday(birthday);
    setFormModalVisible(true);
  };

  const runMutation = async (task: () => Promise<void>) => {
    if (mutationInProgress.current) return false;
    mutationInProgress.current = true;
    refreshVersion.current++;
    setSaving(true);
    try {
      await task();
      return true;
    } catch (error) {
      Alert.alert('Opération impossible', error instanceof Error ? error.message : 'Réessayez.');
      return false;
    } finally {
      mutationInProgress.current = false;
      setSaving(false);
    }
  };

  const askForFirstReminderPermission = async () => {
    try {
      const current = await getNotificationPermissions();
      if (current.status === 'undetermined' && current.canAskAgain) {
        await requestNotificationPermissions();
      }
    } catch {
      // La saisie est déjà enregistrée. Le rafraîchissement affichera l’état réel.
    }
  };

  const saveProfile = async (input: CreateBirthdayInput, profile: BirthdayProfile | null) => {
    await runMutation(async () => {
      const saved = profile ? await updateBirthday(profile.id, input) : await createBirthday(input);
      setBirthdays(current => profile
        ? current.map(item => item.id === saved.id ? saved : item)
        : [...current, saved]);
      setFormModalVisible(false);
      setSelectedProfileId(saved.id);
      setReminderStatuses(current => {
        const next = { ...current };
        delete next[saved.id];
        return next;
      });
      const effective = getEffectiveReminderSettings(saved.reminder, globalSettings);
      if (getReminderRules(effective).some(rule => rule.enabled)) await askForFirstReminderPermission();
      await refreshState();
    });
  };

  const handleDeleteFromDetail = async () => {
    if (!selectedProfile) return;
    await runMutation(async () => {
      const oldIds = await deleteBirthday(selectedProfile.id);
      setBirthdays(current => current.filter(profile => profile.id !== selectedProfile.id));
      setSelectedProfileId(null);
      if (!await refreshState(oldIds)) {
        Alert.alert('Fiche supprimée', 'L’état des rappels n’a pas pu être vérifié. Réessayez dans Paramètres.');
      }
    });
  };

  const handleSaveSettings = (settings: GlobalReminderSettings) =>
    runMutation(async () => {
      saveGlobalSettings(settings);
      setGlobalSettings(settings);
      if (getReminderRules(settings).some(rule => rule.enabled) &&
        birthdays.some(profile => profile.reminder.mode === 'default')) await askForFirstReminderPermission();
      await refreshState();
    });

  const showAddButton = activeTab === 'upcoming' || activeTab === 'calendar';
  const settingsStatus = Object.values(reminderStatuses).includes('failed') || syncFailed;

  if (loading || !launchShown) return <LaunchScreen onShown={markLaunchShown} />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      {storageError ? (
        <View style={styles.centered}>
          <Text style={styles.notice}>Les données locales n’ont pas pu être ouvertes.</Text>
          <TouchableOpacity accessibilityRole="button" onPress={handlePullRefresh}>
            <Text style={styles.retry}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.tabLayout, selectedProfile ? styles.hidden : null]}>
            <View style={styles.tabBody}>
              <ScrollView
                key={activeTab}
                style={styles.container}
                contentContainerStyle={[styles.contentContainer, showAddButton && styles.contentWithAddButton]}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handlePullRefresh} colors={[THEME.colors.primary]} />
                }
              >
                {activeTab === 'upcoming' && (
                  <UpcomingSection
                    birthdays={birthdays}
                    onOpenProfile={handleOpenProfile}
                    onOpenSettings={() => setActiveTab('settings')}
                  />
                )}

                {activeTab === 'calendar' && (
                  <>
                    <View style={[styles.pageHeading, styles.calendarHeading]}>
                      <Text accessibilityRole="header" style={styles.pageTitle}>Calendrier</Text>
                    </View>
                    <CalendarSection birthdays={birthdays} onOpenProfile={handleOpenProfile} />
                  </>
                )}

                {activeTab === 'settings' && (
                  <>
                    <View style={styles.pageHeading}>
                      <Text accessibilityRole="header" style={styles.pageTitle}>Paramètres</Text>
                    </View>
                    <GlobalSettingsSection
                      settings={globalSettings}
                      permission={permission}
                      saving={saving}
                      syncFailed={settingsStatus}
                      onRequestPermission={handleRequestPermission}
                      onRequestExactAlarm={handleRequestExactAlarm}
                      onRetry={handlePullRefresh}
                      onSave={handleSaveSettings}
                    />
                    {__DEV__ && (
                      <TouchableOpacity
                        style={styles.diagnosticsLink}
                        onPress={() => setActiveTab('testbench')}
                        accessibilityRole="button"
                      >
                        <Text style={styles.diagnosticsTitle}>Diagnostics des notifications</Text>
                        <Text style={styles.diagnosticsArrow}>›</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {activeTab === 'testbench' && (
                  <>
                    <View style={styles.pageHeading}>
                      <TouchableOpacity style={styles.backToSettings} onPress={() => setActiveTab('settings')}>
                        <Text style={styles.backToSettingsText}>‹  Paramètres</Text>
                      </TouchableOpacity>
                      <Text style={styles.pageTitle}>Outils de notification</Text>
                      <Text style={styles.pageSubtitle}>Vérifiez les alertes sur cet appareil.</Text>
                    </View>
                    <PermissionCard
                      permission={permission}
                      onRequestPermission={handleRequestPermission}
                      onSendImmediateTest={handleImmediateTest}
                    />

                    <ValidationGuide />

                    <QuickTestSection
                      onScheduleShortTerm={handleScheduleShortTerm}
                      onScheduleMamanScenario={handleScheduleMamanScenario}
                      onScheduleNearYearlyTest={handleScheduleNearYearlyTest}
                    />

                    <ScheduledListSection
                      notifications={scheduledList}
                      onRefresh={handlePullRefresh}
                      onCancelOne={handleCancelOne}
                      onCancelAll={handleCancelAll}
                    />
                  </>
                )}

                {activeTab === 'testbench' && (
                  <EventLogSection
                    logs={logs}
                    onClearLogs={() => setLogs([])}
                  />
                )}
              </ScrollView>

              {showAddButton && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleOpenAddForm}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Ajouter un anniversaire"
                >
                  <Plus size={27} color="#FFFFFF" strokeWidth={2.2} />
                </TouchableOpacity>
              )}
            </View>
            <View accessibilityRole="tablist" style={styles.bottomNav}>
              {TABS.map(({ key, label, Icon }) => {
                const selected = activeTab === key || (key === 'settings' && activeTab === 'testbench');
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.navItem}
                    onPress={() => setActiveTab(key)}
                    activeOpacity={0.75}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                  >
                    <Icon size={22} color={selected ? THEME.colors.primary : THEME.colors.textSecondary}
                      strokeWidth={selected ? 2.2 : 1.8} />
                    <Text style={[styles.navLabel, selected && styles.navLabelActive]}>{label}</Text>
                    {selected && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {selectedProfile && (
            <ProfileDetailView
              key={profileKey}
              birthday={selectedProfile}
              defaults={globalSettings}
              status={syncFailed ? 'failed' : reminderStatuses[selectedProfile.id]}
              saving={saving}
              onSave={reminder => saveProfile({ ...selectedProfile, reminder }, selectedProfile)}
              onEdit={() => handleOpenEditForm(selectedProfile)}
              onDelete={handleDeleteFromDetail}
              onGoBack={() => setSelectedProfileId(null)}
            />
          )}
        </>
      )}

      <BirthdayFormModal
        visible={formModalVisible}
        editingBirthday={editingBirthday}
        defaults={globalSettings}
        saving={saving}
        onClose={() => setFormModalVisible(false)}
        onSave={input => saveProfile(input, editingBirthday)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  tabLayout: { flex: 1 },
  tabBody: { flex: 1 },
  hidden: { display: 'none' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notice: { color: THEME.colors.textPrimary, textAlign: 'center' },
  retry: { color: THEME.colors.primary, fontWeight: '700', padding: 12 },
  pageHeading: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 4,
  },
  calendarHeading: { paddingTop: 68 },
  pageTitle: THEME.screenTitle,
  pageSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  backToSettings: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginBottom: 14,
    borderRadius: 13,
    backgroundColor: THEME.colors.surface,
  },
  backToSettingsText: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  diagnosticsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    backgroundColor: THEME.colors.cardBackground,
  },
  diagnosticsTitle: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  diagnosticsArrow: {
    color: THEME.colors.textSecondary,
    fontSize: 24,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 66,
    paddingHorizontal: 4,
    paddingTop: 3,
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  navItem: {
    flex: 1,
    minHeight: 56,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  navLabelActive: {
    color: THEME.colors.primary,
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    width: 42,
    height: 3,
    borderRadius: 2,
    backgroundColor: THEME.colors.primary,
    bottom: -1,
  },
  addButton: {
    position: 'absolute',
    right: 22,
    bottom: 16,
    width: 58,
    minHeight: 58,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: THEME.colors.primary,
    shadowColor: THEME.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentWithAddButton: { paddingBottom: 86 },
  contentContainer: {
    paddingBottom: 24,
  },
});
