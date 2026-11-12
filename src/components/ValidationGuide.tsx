import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

export const ValidationGuide: React.FC = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.badge}>Protocole Lot 1 · PRD</Text>
      <Text style={styles.title}>Guide de test sur votre téléphone Android</Text>

      <View style={styles.stepItem}>
        <Text style={styles.stepNum}>1</Text>
        <View style={styles.stepContent}>
          <Text style={styles.stepHeader}>Test Écran Verrouillé :</Text>
          <Text style={styles.stepText}>
            Appuyez sur "30 secondes", puis verrouillez immédiatement l'écran de votre téléphone. Attendez la sonnerie et la notification.
          </Text>
        </View>
      </View>

      <View style={styles.stepItem}>
        <Text style={styles.stepNum}>2</Text>
        <View style={styles.stepContent}>
          <Text style={styles.stepHeader}>Test Hors Ligne (Mode Avion) :</Text>
          <Text style={styles.stepText}>
            Activez le mode avion sur Android, lancez un rappel "30 secondes" et verrouillez l'écran. Vérifiez qu'il s'affiche sans réseau.
          </Text>
        </View>
      </View>

      <View style={styles.stepItem}>
        <Text style={styles.stepNum}>3</Text>
        <View style={styles.stepContent}>
          <Text style={styles.stepHeader}>Scénario Maman (2 février) :</Text>
          <Text style={styles.stepText}>
            Appuyez sur "Scénario Maman". Observez la création de deux déclencheurs annuels récurrents (1er fév. 19h et 2 fév. 06h).
          </Text>
        </View>
      </View>

      <View style={styles.stepItem}>
        <Text style={styles.stepNum}>4</Text>
        <View style={styles.stepContent}>
          <Text style={styles.stepHeader}>Test d’Annulation :</Text>
          <Text style={styles.stepText}>
            Programmez "60 secondes", puis appuyez sur "Annuler" dans la liste avant la fin du délai. Vérifiez qu'aucune notification n'apparaît.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: '#E8D4B4',
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.colors.primary,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  stepText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
});
