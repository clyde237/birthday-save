import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';

interface QuickTestSectionProps {
  onScheduleShortTerm: (seconds: number) => void;
  onScheduleMamanScenario: () => void;
  onScheduleNearYearlyTest: () => void;
}

export const QuickTestSection: React.FC<QuickTestSectionProps> = ({
  onScheduleShortTerm,
  onScheduleMamanScenario,
  onScheduleNearYearlyTest,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>1. Tests rapides hors ligne & écran verrouillé</Text>
      <Text style={styles.sectionDescription}>
        Programmez une alerte à court terme, puis mettez en veille le téléphone ou activez le mode avion.
      </Text>

      <View style={styles.gridRow}>
        <TouchableOpacity
          style={[styles.testButton, styles.button10s]}
          onPress={() => onScheduleShortTerm(10)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonBadge}>Rapide</Text>
          <Text style={styles.testButtonTitle}>10 secondes</Text>
          <Text style={styles.testButtonSub}>Verrouiller immédiatement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.button30s]}
          onPress={() => onScheduleShortTerm(30)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonBadge}>Idéal</Text>
          <Text style={styles.testButtonTitle}>30 secondes</Text>
          <Text style={styles.testButtonSub}>Mode avion + verrouillé</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.button60s]}
          onPress={() => onScheduleShortTerm(60)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonBadge}>Complet</Text>
          <Text style={styles.testButtonTitle}>60 secondes</Text>
          <Text style={styles.testButtonSub}>Quitter l’app + veille</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: THEME.spacing.lg }]}>
        2. Scénarios PRD & Récurrence annuelle
      </Text>

      <TouchableOpacity
        style={styles.scenarioCard}
        onPress={onScheduleMamanScenario}
        activeOpacity={0.8}
      >
        <View style={styles.scenarioIconBox}>
          <Text style={styles.scenarioIcon}>👩‍👧</Text>
        </View>
        <View style={styles.scenarioContent}>
          <Text style={styles.scenarioTitle}>Scénario de référence : Maman (2 févr.)</Text>
          <Text style={styles.scenarioDesc}>
            Programme 2 rappels annuels : la veille à 19h00 (1er fév.) et le jour J à 06h00 (2 fév.).
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.scenarioCard, styles.scenarioCardAlt]}
        onPress={onScheduleNearYearlyTest}
        activeOpacity={0.8}
      >
        <View style={styles.scenarioIconBox}>
          <Text style={styles.scenarioIcon}>🔄</Text>
        </View>
        <View style={styles.scenarioContent}>
          <Text style={styles.scenarioTitle}>Déclencheur annuel proche (+2 min)</Text>
          <Text style={styles.scenarioDesc}>
            Teste un trigger annuel programmé aujourd’hui dans 2 minutes pour valider la récurrence Android.
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  sectionDescription: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    marginBottom: THEME.spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  testButton: {
    flex: 1,
    backgroundColor: THEME.colors.cardBackground,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button10s: {
    borderTopWidth: 3,
    borderTopColor: THEME.colors.accent,
  },
  button30s: {
    borderTopWidth: 3,
    borderTopColor: THEME.colors.primary,
  },
  button60s: {
    borderTopWidth: 3,
    borderTopColor: THEME.colors.primaryDark,
  },
  buttonBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: THEME.borderRadius.round,
    marginBottom: 4,
  },
  testButtonTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  testButtonSub: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  scenarioCard: {
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.sm,
  },
  scenarioCardAlt: {
    borderColor: THEME.colors.accent,
  },
  scenarioIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioIcon: {
    fontSize: 22,
  },
  scenarioContent: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  scenarioDesc: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
});
