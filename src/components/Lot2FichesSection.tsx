import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BirthdayProfile } from '../types';
import { BirthdayCard } from './BirthdayCard';
import { BirthdayFormModal } from './BirthdayFormModal';
import { THEME } from '../constants/theme';
import {
  CreateBirthdayInput,
  createBirthday,
  updateBirthday,
  deleteBirthday,
} from '../database/birthdayRepository';
import {
  syncRemindersForBirthday,
  cancelRemindersList,
} from '../services/reminderScheduler';
import { getNextBirthdayDate } from '../utils/dateUtils';
import { getGlobalSettings } from '../database/settingsRepository';

interface Lot2FichesSectionProps {
  birthdays: BirthdayProfile[];
  onRefreshList: () => Promise<void>;
  onLogEvent?: (type: 'scheduled' | 'received' | 'response' | 'cancelled' | 'error', title: string, details: string) => void;
}

export const Lot2FichesSection: React.FC<Lot2FichesSectionProps> = ({
  birthdays,
  onRefreshList,
  onLogEvent,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState<BirthdayProfile | null>(null);

  // Tri chronologique des prochains anniversaires
  const sortedBirthdays = [...birthdays].sort((a, b) => {
    const nextA = getNextBirthdayDate(a.birthMonth, a.birthDay);
    const nextB = getNextBirthdayDate(b.birthMonth, b.birthDay);
    return nextA.daysRemaining - nextB.daysRemaining;
  });

  const handleOpenAdd = () => {
    setEditingBirthday(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (b: BirthdayProfile) => {
    setEditingBirthday(b);
    setModalVisible(true);
  };

  const handleSave = async (input: CreateBirthdayInput) => {
    try {
      const globalSettings = getGlobalSettings();
      let savedProfile: BirthdayProfile;

      if (editingBirthday) {
        savedProfile = await updateBirthday(editingBirthday.id, input);
        const newNotifIds = await syncRemindersForBirthday(savedProfile, globalSettings);
        onLogEvent?.(
          'scheduled',
          'Fiche & rappels modifiés',
          `Anniversaire de ${input.name} mis à jour (${newNotifIds.length} rappel(s) Android actif(s)).`
        );
        Alert.alert('Succès', `La fiche de ${input.name} a été modifiée avec ses rappels.`);
      } else {
        savedProfile = await createBirthday(input);
        const newNotifIds = await syncRemindersForBirthday(savedProfile, globalSettings);
        onLogEvent?.(
          'scheduled',
          'Fiche & rappels créés',
          `Anniversaire de ${input.name} enregistré (${newNotifIds.length} rappel(s) programmés).`
        );
        Alert.alert('Succès', `L'anniversaire de ${input.name} a été enregistré.`);
      }
      setModalVisible(false);
      await onRefreshList();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d’enregistrer la fiche.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Supprimer la fiche ?',
      `Êtes-vous sûr de vouloir supprimer l’anniversaire de ${name} ? Ses rappels programmés seront annulés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const oldIds = await deleteBirthday(id);
              await cancelRemindersList(oldIds);
              onLogEvent?.(
                'cancelled',
                'Fiche supprimée',
                `Fiche de ${name} supprimée et ${oldIds.length} rappel(s) annulé(s) d'Android.`
              );
              await onRefreshList();
            } catch (err: any) {
              Alert.alert('Erreur', err?.message || 'Impossible de supprimer.');
            }
          },
        },
      ]
    );
  };

  const handleAddMamanQuick = async () => {
    try {
      const profile = await createBirthday({
        name: 'Maman',
        birthMonth: 2,
        birthDay: 2,
        birthYear: 1965,
        notes: 'Aime les roses blanches',
        reminder: { mode: 'default' },
      });
      const ids = await syncRemindersForBirthday(profile);
      onLogEvent?.(
        'scheduled',
        'Scénario Maman créé',
        `Fiche de Maman (2 fév.) créée avec ${ids.length} rappels par défaut programmés.`
      );
      await onRefreshList();
      Alert.alert(
        'Profil Maman créé',
        'Maman a été enregistrée avec le mode "Par défaut" (2 rappels annuels programmés).'
      );
    } catch (err: any) {
      Alert.alert('Information', err?.message || 'Erreur lors de la création.');
    }
  };

  const handleAddAmiQuick = async () => {
    try {
      const profile = await createBirthday({
        name: 'Ami',
        birthMonth: 8,
        birthDay: 18,
        notes: 'Fan de cinéma',
        reminder: {
          mode: 'custom',
          customDayBeforeEnabled: false,
          customSameDayEnabled: true,
          customSameDayHour: 8,
          customSameDayMinute: 0,
        },
      });
      const ids = await syncRemindersForBirthday(profile);
      onLogEvent?.(
        'scheduled',
        'Scénario Ami créé',
        `Ami (18 août) créé en mode personnalisé : uniquement le jour même à 8h (${ids.length} rappel).`
      );
      await onRefreshList();
      Alert.alert(
        'Profil Ami créé',
        'Ami a été enregistré avec un rappel personnalisé (jour J à 8h00 seulement).'
      );
    } catch (err: any) {
      Alert.alert('Information', err?.message || 'Erreur lors de la création.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Fiches d’anniversaire ({birthdays.length})</Text>
          <Text style={styles.subtitle}>Stockage SQLite & Synchronisation des rappels</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Raccourcis pour tester le scénario de référence du PRD (Maman + Ami) */}
      <View style={styles.quickBar}>
        <TouchableOpacity
          style={styles.quickAddButton}
          onPress={handleAddMamanQuick}
          activeOpacity={0.8}
        >
          <Text style={styles.quickAddText}>👩‍👧 + Maman (Par défaut)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAddButton, styles.quickAddButtonAlt]}
          onPress={handleAddAmiQuick}
          activeOpacity={0.8}
        >
          <Text style={[styles.quickAddText, styles.quickAddTextAlt]}>🧑‍🤝‍🧑 + Ami (Personnalisé 8h)</Text>
        </TouchableOpacity>
      </View>

      {sortedBirthdays.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🎂</Text>
          <Text style={styles.emptyTitle}>Aucune fiche enregistrée</Text>
          <Text style={styles.emptyText}>
            Appuyez sur « + Ajouter » ou chargez les profils tests ci-dessus pour vérifier la programmation.
          </Text>
        </View>
      ) : (
        sortedBirthdays.map((item) => (
          <BirthdayCard
            key={item.id}
            birthday={item}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        ))
      )}

      <BirthdayFormModal
        visible={modalVisible}
        editingBirthday={editingBirthday}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  addBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  quickBar: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  quickAddButtonAlt: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  quickAddText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  quickAddTextAlt: {
    color: '#0369A1',
  },
  emptyCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptyText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
