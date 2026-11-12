import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScrollView,
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
import { Header } from './src/components/Header';
import { PermissionCard } from './src/components/PermissionCard';
import { QuickTestSection } from './src/components/QuickTestSection';
import { ScheduledListSection } from './src/components/ScheduledListSection';
import { EventLogSection } from './src/components/EventLogSection';
import { ValidationGuide } from './src/components/ValidationGuide';
import { Lot2FichesSection } from './src/components/Lot2FichesSection';
import { GlobalSettingsSection } from './src/components/GlobalSettingsSection';
import { UpcomingSection } from './src/components/UpcomingSection';
import { CalendarSection } from './src/components/CalendarSection';
import { ProfileDetailView } from './src/components/ProfileDetailView';
import { BirthdayFormModal } from './src/components/BirthdayFormModal';
import { THEME } from './src/constants/theme';
import {
  PermissionReport,
  ScheduledNotificationInfo,
  NotificationLogItem,
  BirthdayProfile,
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
  cancelAllNotifications,
} from './src/services/notificationService';
import {
  getAllBirthdays,
  deleteBirthday,
  CreateBirthdayInput,
  createBirthday,
  updateBirthday,
} from './src/database/birthdayRepository';
import {
  syncRemindersForBirthday,
  cancelRemindersList,
} from './src/services/reminderScheduler';
import { getGlobalSettings } from './src/database/settingsRepository';

type ActiveTab = 'upcoming' | 'calendar' | 'fiches' | 'testbench';

/**
 * Vue possible :
 * - 'tabs' : Navigation principale par onglets
 * - 'profile' : Détail d'un profil (deep-link depuis notification ou clic)
 * - 'editProfile' : Modale d'édition (superposée)
 */
type ViewMode = 'tabs' | 'profile';

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>('tabs');
  const [selectedProfile, setSelectedProfile] = useState<BirthdayProfile | null>(null);
  const [birthdays, setBirthdays] = useState<BirthdayProfile[]>([]);
  const [permission, setPermission] = useState<PermissionReport | null>(null);
  const [scheduledList, setScheduledList] = useState<ScheduledNotificationInfo[]>([]);
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Modale d'ajout/modification (peut s'ouvrir depuis n'importe quel onglet)
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState<BirthdayProfile | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const handledNotificationResponse = useRef<string | null>(null);

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

  const refreshState = useCallback(async () => {
    try {
      const bdays = await getAllBirthdays();
      setBirthdays(bdays);

      // Si un profil est ouvert, le mettre à jour avec les dernières données
      if (selectedProfile) {
        const updated = bdays.find((b) => b.id === selectedProfile.id);
        if (updated) {
          setSelectedProfile(updated);
        } else {
          // Le profil a été supprimé → retour à "À venir"
          setViewMode('tabs');
          setSelectedProfile(null);
          setActiveTab('upcoming');
        }
      }

      const perms = await getNotificationPermissions();
      setPermission(perms);
      const list = await getScheduledNotificationsList();
      setScheduledList(list);
    } catch (err: any) {
      addLog('error', 'Erreur de rafraîchissement', err?.message || String(err));
    }
  }, [addLog, selectedProfile]);

  const handleNotificationResponse = useCallback(async (response: Notifications.NotificationResponse) => {
    const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}:${response.notification.date}`;
    if (handledNotificationResponse.current === responseKey) return;
    handledNotificationResponse.current = responseKey;

    const title = response.notification.request.content.title || 'Clic notification';
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    addLog('response', `Ouverture : ${title}`, `L'utilisateur a cliqué sur la notification. Données : ${JSON.stringify(data || {})}`);

    const profileId = typeof data?.profileId === 'string' ? data.profileId : undefined;
    const profileName = typeof data?.profileName === 'string' ? data.profileName : undefined;
    let destination: BirthdayProfile | null | undefined;
    let hasAmbiguousName = false;

    if (profileId || profileName) {
      try {
        const profiles = await getAllBirthdays();
        const matches = profileId
          ? profiles.filter((profile) => profile.id === profileId)
          : profiles.filter((profile) => profile.name === profileName);

        if (matches.length === 1) {
          destination = matches[0];
        } else {
          destination = null;
          hasAmbiguousName = matches.length > 1;
        }
      } catch (err: any) {
        addLog('error', 'Erreur ouverture notification', err?.message || String(err));
      }
    }

    await refreshState();
    if (destination !== undefined) {
      if (destination) {
        setSelectedProfile(destination);
        setViewMode('profile');
      } else {
        setActiveTab('upcoming');
        setViewMode('tabs');
        setSelectedProfile(null);
        addLog(
          'cancelled',
          hasAmbiguousName ? 'Fiche ambiguë' : 'Fiche introuvable',
          hasAmbiguousName
            ? `Plusieurs fiches portent le nom "${profileName}". Redirection vers À venir.`
            : `Le profil "${profileName ?? profileId}" a été supprimé. Redirection vers À venir.`
        );
      }
    }

    try {
      await Notifications.clearLastNotificationResponseAsync();
    } catch (err: any) {
      addLog('error', 'Erreur nettoyage notification', err?.message || String(err));
    }
  }, [addLog, refreshState]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        await setupNotificationChannel();
      } catch (err) {
        console.warn('Init channel:', err);
      }
      if (isMounted) {
        try {
          const lastResponse = await Notifications.getLastNotificationResponseAsync();
          if (lastResponse && isMounted) {
            await handleNotificationResponse(lastResponse);
          }
        } catch (err: any) {
          addLog('error', 'Erreur lecture dernière notification', err?.message || String(err));
        }
      }
      if (isMounted) {
        await refreshState();
      }
    }

    init();

    // Écouteur de notification reçue au premier plan
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const title = notification.request.content.title || 'Notification reçue';
      const body = notification.request.content.body || '';
      addLog('received', title, `Corps: "${body}" · Reçu en direct au premier plan.`);
      refreshState();
    });

    // Écouteur de clic sur notification → Deep-link vers la fiche
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleNotificationResponse(response);
    });

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [addLog, handleNotificationResponse, refreshState]);

  const handlePullRefresh = async () => {
    setRefreshing(true);
    await refreshState();
    setRefreshing(false);
  };

  // ----- Handlers communs -----

  const handleRequestPermission = async () => {
    try {
      const perms = await requestNotificationPermissions();
      setPermission(perms);
      if (perms.granted) {
        addLog('scheduled', 'Permissions accordées', 'Canal Android initialisé.');
        Alert.alert('Succès', 'Les notifications sont autorisées avec son et bannière.');
      } else {
        addLog('error', 'Permissions refusées', 'L\'utilisateur a refusé les notifications.');
        Alert.alert('Attention', 'Sans cette autorisation, Android bloquera les alertes d\'anniversaire.');
      }
    } catch (err: any) {
      addLog('error', 'Échec demande permission', err?.message || String(err));
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
      await cancelAllNotifications();
      addLog('cancelled', 'Toutes les notifications annulées', 'La file Android a été vidée.');
      await refreshState();
    } catch (err: any) {
      addLog('error', 'Erreur annulation globale', err?.message || String(err));
    }
  };

  // ----- Navigation vers un profil -----

  const handleOpenProfile = (birthday: BirthdayProfile) => {
    setSelectedProfile(birthday);
    setViewMode('profile');
  };

  const handleGoBackFromProfile = () => {
    setSelectedProfile(null);
    setViewMode('tabs');
  };

  // ----- Modale d'ajout/édition (depuis n'importe quel écran) -----

  const handleOpenAddForm = () => {
    setEditingBirthday(null);
    setFormModalVisible(true);
  };

  const handleOpenEditForm = (birthday: BirthdayProfile) => {
    setEditingBirthday(birthday);
    setFormModalVisible(true);
  };

  const handleFormSave = async (input: CreateBirthdayInput) => {
    try {
      const globalSettings = getGlobalSettings();
      let savedProfile: BirthdayProfile;

      if (editingBirthday) {
        savedProfile = await updateBirthday(editingBirthday.id, input);
        const newNotifIds = await syncRemindersForBirthday(savedProfile, globalSettings);
        addLog(
          'scheduled',
          'Fiche & rappels modifiés',
          `Anniversaire de ${input.name} mis à jour (${newNotifIds.length} rappel(s) Android actif(s)).`
        );
        Alert.alert('Succès', `La fiche de ${input.name} a été modifiée avec ses rappels.`);
      } else {
        savedProfile = await createBirthday(input);
        const newNotifIds = await syncRemindersForBirthday(savedProfile, globalSettings);
        addLog(
          'scheduled',
          'Fiche & rappels créés',
          `Anniversaire de ${input.name} enregistré (${newNotifIds.length} rappel(s) programmés).`
        );
        Alert.alert('Succès', `L'anniversaire de ${input.name} a été enregistré.`);
      }

      setFormModalVisible(false);
      await refreshState();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d\'enregistrer la fiche.');
    }
  };

  // ----- Suppression d'un profil (depuis la vue détail) -----

  const handleDeleteFromDetail = async () => {
    if (!selectedProfile) return;
    try {
      const oldIds = await deleteBirthday(selectedProfile.id);
      await cancelRemindersList(oldIds);
      addLog(
        'cancelled',
        'Fiche supprimée',
        `Fiche de ${selectedProfile.name} supprimée et ${oldIds.length} rappel(s) annulé(s).`
      );
      setViewMode('tabs');
      setSelectedProfile(null);
      setActiveTab('upcoming');
      await refreshState();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de supprimer.');
    }
  };

  const defaultProfilesCount = birthdays.filter((b) => (b.reminder?.mode ?? 'default') === 'default').length;

  // ----- Tabs -----

  const TAB_CONFIG: { key: ActiveTab; icon: string; label: string }[] = [
    { key: 'upcoming', icon: '📋', label: 'À venir' },
    { key: 'calendar', icon: '📅', label: 'Calendrier' },
    { key: 'fiches', icon: '⚙', label: 'Réglages' },
    { key: 'testbench', icon: '🔔', label: 'Tests' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <Header />

      {viewMode === 'profile' && selectedProfile ? (
        /* ----- VUE DÉTAIL PROFIL ----- */
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handlePullRefresh} colors={[THEME.colors.primary]} />
          }
        >
          <ProfileDetailView
            birthday={selectedProfile}
            onEdit={() => handleOpenEditForm(selectedProfile)}
            onDelete={handleDeleteFromDetail}
            onGoBack={handleGoBackFromProfile}
          />
        </ScrollView>
      ) : (
        /* ----- VUE ONGLETS ----- */
        <>
          {/* Barre de navigation */}
          <View style={styles.tabBar}>
            {TAB_CONFIG.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, activeTab === tab.key ? styles.tabButtonActive : null]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, activeTab === tab.key ? styles.tabButtonTextActive : null]}>
                  {tab.icon} {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handlePullRefresh} colors={[THEME.colors.primary]} />
            }
          >
            {activeTab === 'upcoming' && (
              <UpcomingSection
                birthdays={birthdays}
                onOpenProfile={handleOpenProfile}
                onAddNew={handleOpenAddForm}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarSection
                birthdays={birthdays}
                onOpenProfile={handleOpenProfile}
              />
            )}

            {activeTab === 'fiches' && (
              <>
                <Lot2FichesSection
                  birthdays={birthdays}
                  onRefreshList={refreshState}
                  onLogEvent={addLog}
                />
                <GlobalSettingsSection
                  permission={permission}
                  onRequestPermission={handleRequestPermission}
                  defaultProfilesCount={defaultProfilesCount}
                  onRefreshAll={refreshState}
                  onLogEvent={addLog}
                />
              </>
            )}

            {activeTab === 'testbench' && (
              <>
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
                  onRefresh={refreshState}
                  onCancelOne={handleCancelOne}
                  onCancelAll={handleCancelAll}
                />
              </>
            )}

            {activeTab !== 'upcoming' && (
              <EventLogSection
                logs={logs}
                onClearLogs={() => setLogs([])}
              />
            )}
          </ScrollView>
        </>
      )}

      {/* Modale d'ajout/édition (superposée à tout écran) */}
      <BirthdayFormModal
        visible={formModalVisible}
        editingBirthday={editingBirthday}
        onClose={() => setFormModalVisible(false)}
        onSave={handleFormSave}
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
    backgroundColor: THEME.colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: THEME.borderRadius.round,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabButtonActive: {
    backgroundColor: THEME.colors.surface,
  },
  tabButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFE8DC',
  },
  tabButtonTextActive: {
    color: THEME.colors.primaryDark,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
});
