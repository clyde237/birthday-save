import React, { useState } from 'react';
import { getGlobalSettings } from '../database/settingsRepository';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Plus } from 'lucide-react-native';
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
      let savedProfile: BirthdayProfile;

      if (editingBirthday) {
        savedProfile = await updateBirthday(editingBirthday.id, input);
        const newNotifIds = await syncRemindersForBirthday(savedProfile);
        onLogEvent?.(
          'scheduled',
          'Fiche & rappels modifiés',
          `Anniversaire de ${input.name} mis à jour (${newNotifIds.length} rappel(s) Android actif(s)).`
        );
        Alert.alert('Succès', `La fiche de ${input.name} a été modifiée avec ses rappels.`);
      } else {
        savedProfile = await createBirthday(input);
        const newNotifIds = await syncRemindersForBirthday(savedProfile);
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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Mes anniversaires</Text>
          <Text style={styles.subtitle}>{birthdays.length} proche{birthdays.length !== 1 ? 's' : ''} enregistré{birthdays.length !== 1 ? 's' : ''}</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
          <Plus size={19} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {sortedBirthdays.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>♡</Text>
          <Text style={styles.emptyTitle}>Votre carnet est encore vide</Text>
          <Text style={styles.emptyText}>
            Ajoutez vos proches pour garder leurs anniversaires et leurs rappels à portée de main.
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
        defaults={getGlobalSettings()}
        saving={false}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  addBtn: {
    backgroundColor: THEME.colors.primary,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 14,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  emptyIcon: {
    fontSize: 42,
    color: THEME.colors.primary,
    marginBottom: 7,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
  },
});
