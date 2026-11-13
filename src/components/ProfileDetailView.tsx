import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { ArrowLeft, CakeSlice, CalendarDays, Camera, ChevronDown, Heart, ImagePlus, Pencil, RefreshCw, Share2, Sparkles, Trash2, X } from 'lucide-react-native';
import type { BirthdayProfile, BirthdayReminderConfig, GlobalReminderSettings, ReminderMode } from '../types';
import type { ReminderStatus } from '../services/reminderScheduler';
import { THEME } from '../constants/theme';
import { getNextBirthdayDate, calculateNextAge, getNextReminderOccurrence, MONTH_NAMES_FR } from '../utils/dateUtils';
import { formatReminderTime, getEffectiveReminderSettings, getReminderRules, parseReminderTime, VARIABLE_REMINDER_YEARS } from '../utils/reminderRules';
import { ReminderTimeInput } from './ReminderTimeInput';
import { buildWishMessage } from '../utils/wishMessages';
import { getProfileTheme } from '../constants/profileThemes';

const MODES: Record<ReminderMode, string> = {
  default: 'Réglages par défaut',
  custom: 'Personnalisés',
  disabled: 'Désactivés',
};

const STATUS_TEXT: Record<ReminderStatus, string> = {
  scheduled: 'Rappels programmés.',
  approximate: 'Rappels programmés. Android peut les livrer après l’heure choisie.',
  blocked: 'Notifications bloquées. Vous pouvez les autoriser dans Paramètres.',
  disabled: 'Aucun rappel actif.',
  failed: 'Certains rappels n’ont pas pu être mis à jour. Réessayez dans Paramètres.',
};

interface Props {
  birthday: BirthdayProfile;
  defaults: GlobalReminderSettings;
  status?: ReminderStatus;
  saving: boolean;
  onSave: (reminder: BirthdayReminderConfig) => void;
  onEdit: () => void;
  onDelete: () => void;
  onGoBack: () => void;
}

function shortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function ProfileDetailView({ birthday, defaults, status, saving, onSave, onEdit, onDelete, onGoBack }: Props) {
  const { reminder } = birthday;
  const profileTheme = getProfileTheme(birthday.colorTheme);
  const [draft, setDraft] = useState(reminder);
  const [eveTime, setEveTime] = useState(formatReminderTime(reminder.customDayBeforeHour, reminder.customDayBeforeMinute));
  const [dayTime, setDayTime] = useState(formatReminderTime(reminder.customSameDayHour, reminder.customSameDayMinute));
  const [showModes, setShowModes] = useState(false);
  const [error, setError] = useState('');
  const { nextDate, isToday } = getNextBirthdayDate(birthday.birthMonth, birthday.birthDay);
  const age = calculateNextAge(birthday.birthYear, nextDate);
  const wishInput = {
    id: birthday.id,
    name: birthday.name,
    age,
    year: nextDate.getFullYear(),
    relation: birthday.relation,
  };
  const [wishShuffle, setWishShuffle] = useState(0);
  const [wishText, setWishText] = useState(() => buildWishMessage(wishInput));
  const [cardPhotoUri, setCardPhotoUri] = useState(birthday.profileImageUri);
  const [cardPhotoReady, setCardPhotoReady] = useState(!birthday.profileImageUri);
  const [sharingCard, setSharingCard] = useState(false);
  const cardRef = useRef<ViewShotRef>(null);

  useEffect(() => {
    setWishShuffle(0);
    setWishText(buildWishMessage(wishInput));
  }, [birthday.id, birthday.name, birthday.birthYear, birthday.relation, age, nextDate.getFullYear()]);

  useEffect(() => {
    setCardPhotoUri(birthday.profileImageUri);
    setCardPhotoReady(!birthday.profileImageUri);
  }, [birthday.id, birthday.profileImageUri]);

  const effective = getEffectiveReminderSettings(draft, defaults);
  const rules = getReminderRules(effective);
  const isLeapBirthday = birthday.birthMonth === 2 && birthday.birthDay === 29;
  const variableReminders = rules.some(rule => rule.enabled && (
    isLeapBirthday || (birthday.birthMonth === 3 && birthday.birthDay === 1 && rule.type === 'day_before')
  ));

  const save = () => {
    const eve = draft.mode === 'custom' && draft.customDayBeforeEnabled
      ? parseReminderTime(eveTime) : { hour: draft.customDayBeforeHour, minute: draft.customDayBeforeMinute };
    const day = draft.mode === 'custom' && draft.customSameDayEnabled
      ? parseReminderTime(dayTime) : { hour: draft.customSameDayHour, minute: draft.customSameDayMinute };
    if (!eve || !day) {
      setError('Saisissez un horaire entre 00:00 et 23:59.');
      return;
    }
    setError('');
    onSave({
      ...draft,
      customDayBeforeHour: eve.hour, customDayBeforeMinute: eve.minute,
      customSameDayHour: day.hour, customSameDayMinute: day.minute,
    });
  };

  const nextWish = () => {
    const next = wishShuffle + 1;
    setWishShuffle(next);
    setWishText(buildWishMessage(wishInput, next));
  };

  const shareWish = async () => {
    try {
      await Share.share({ message: wishText });
    } catch {
      Alert.alert('Partage impossible', 'Une erreur est survenue lors du partage du message.');
    }
  };

  const chooseCardPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        setCardPhotoUri(result.assets[0].uri);
        setCardPhotoReady(false);
      }
    } catch (pickerError) {
      Alert.alert(
        'Photo indisponible',
        pickerError instanceof Error ? pickerError.message : 'La photo n’a pas pu être sélectionnée.'
      );
    }
  };

  const shareGreetingCard = async () => {
    if (!cardRef.current || sharingCard) return;
    setSharingCard(true);
    try {
      if (!await Sharing.isAvailableAsync()) {
        throw new Error('Le partage de fichiers n’est pas disponible sur cet appareil.');
      }
      if (!cardPhotoReady) {
        throw new Error('La photo de la carte est encore en cours de chargement.');
      }
      const imageUri = await cardRef.current.capture();
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/png',
        dialogTitle: `Carte d’anniversaire pour ${birthday.name}`,
      });
    } catch (shareError) {
      Alert.alert(
        'Création impossible',
        shareError instanceof Error ? shareError.message : 'La carte de vœux n’a pas pu être créée ou partagée.'
      );
    } finally {
      setSharingCard(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: profileTheme.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.toolbar}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: profileTheme.surface }]} onPress={onGoBack} accessibilityRole="button" accessibilityLabel="Retour">
            <ArrowLeft size={23} color={profileTheme.primaryDark} />
          </TouchableOpacity>
          <View style={styles.toolbarActions}>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: profileTheme.surface }]} disabled={saving} onPress={onEdit} accessibilityRole="button" accessibilityLabel="Modifier la fiche">
              <Pencil size={19} color={profileTheme.primaryDark} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: profileTheme.surface }]}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Supprimer la fiche"
              onPress={() => Alert.alert('Supprimer l’anniversaire ?', birthday.name, [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: onDelete },
              ])}
            >
              <Trash2 size={19} color={THEME.colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: profileTheme.avatar }]}>
            {birthday.profileImageUri
              ? <Image source={{ uri: birthday.profileImageUri }} style={styles.avatarImage} />
              : <Text style={styles.initial}>{Array.from(birthday.name)[0]?.toUpperCase()}</Text>}
          </View>
          <View style={styles.copy}>
            <Text accessibilityRole="header" style={styles.name}>{birthday.name}</Text>
            <Text style={[styles.date, { color: profileTheme.primaryDark }]}>{birthday.birthDay} {MONTH_NAMES_FR[birthday.birthMonth - 1].toLowerCase()}{birthday.birthYear ? ` ${birthday.birthYear}` : ''}</Text>
            {age !== null && <Text style={styles.secondary}>Fête ses {age} ans</Text>}
          </View>
        </View>

        {isToday && (
          <>
            <Text accessibilityRole="header" style={styles.heading}>Message de vœux</Text>
            <View style={[styles.wishCard, { backgroundColor: profileTheme.card, borderColor: profileTheme.border }]}>
              <Text style={styles.wishHint}>Personnalisez votre message avant de le partager.</Text>
              <TextInput
                style={styles.wishInput}
                value={wishText}
                onChangeText={setWishText}
                multiline
                accessibilityLabel="Message de vœux modifiable"
              />
              <View style={styles.wishActions}>
                <TouchableOpacity
                  style={[styles.wishSecondary, { backgroundColor: profileTheme.surface }]}
                  onPress={nextWish}
                  accessibilityRole="button"
                  accessibilityLabel="Proposer un autre message"
                >
                  <RefreshCw size={16} color={profileTheme.primaryDark} />
                  <Text style={styles.wishSecondaryText}>Autre idée</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.wishPrimary, { backgroundColor: profileTheme.primary }]}
                  onPress={() => void shareWish()}
                  accessibilityRole="button"
                  accessibilityLabel="Partager le message"
                >
                  <Share2 size={16} color="#FFFFFF" />
                  <Text style={styles.wishPrimaryText}>Partager</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text accessibilityRole="header" style={styles.heading}>Carte de vœux</Text>
            <Text style={styles.cardPhotoLabel}>Photo pour la carte (facultative)</Text>
            <View style={styles.cardPhotoControls}>
              {cardPhotoUri ? (
                <Image source={{ uri: cardPhotoUri }} style={styles.cardPhotoThumbnail} />
              ) : (
                <View style={[styles.cardPhotoThumbnail, styles.cardPhotoPlaceholder]}>
                  <Camera size={21} color={profileTheme.primary} />
                </View>
              )}
              <TouchableOpacity
                style={[styles.wishSecondary, { backgroundColor: profileTheme.surface }]}
                onPress={() => void chooseCardPhoto()}
                accessibilityRole="button"
                accessibilityLabel={cardPhotoUri ? 'Changer la photo de la carte' : 'Importer une photo pour la carte'}
              >
                <ImagePlus size={16} color={THEME.colors.textPrimary} />
                <Text style={styles.wishSecondaryText}>{cardPhotoUri ? 'Changer la photo' : 'Importer une photo'}</Text>
              </TouchableOpacity>
              {cardPhotoUri && (
                <TouchableOpacity
                  style={styles.cardPhotoRemove}
                  onPress={() => {
                    setCardPhotoUri(undefined);
                    setCardPhotoReady(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Retirer la photo de la carte"
                >
                  <X size={18} color={THEME.colors.danger} />
                </TouchableOpacity>
              )}
            </View>
            {birthday.profileImageUri && cardPhotoUri === birthday.profileImageUri && (
              <Text style={styles.secondary}>La photo du profil est utilisée pour cette carte.</Text>
            )}
            <ViewShot
              ref={cardRef}
              style={styles.cardCapture}
              options={{ format: 'png', quality: 1 }}
            >
              <View style={[styles.greetingCard, { backgroundColor: profileTheme.background, borderColor: profileTheme.border }]}>
                <View style={[styles.cardInnerFrame, { backgroundColor: profileTheme.card, borderColor: profileTheme.border }]}>
                  <View style={styles.cardOrnamentTopLeft}>
                    <Sparkles size={25} color={profileTheme.primary} strokeWidth={1.4} />
                  </View>
                  <View style={styles.cardOrnamentTopRight}>
                    <Heart size={20} color={profileTheme.primary} strokeWidth={1.5} />
                  </View>
                  <View style={styles.cardOrnamentBottomLeft}>
                    <Heart size={17} color={profileTheme.primary} strokeWidth={1.5} />
                  </View>
                  <View style={styles.cardOrnamentBottomRight}>
                    <Sparkles size={25} color={profileTheme.primary} strokeWidth={1.4} />
                  </View>

                  <View style={styles.cardEyebrowRow}>
                    <Sparkles size={13} color={profileTheme.primary} />
                    <Text style={[styles.cardEyebrow, { color: profileTheme.primary }]}>UNE JOURNÉE À CÉLÉBRER</Text>
                    <Sparkles size={13} color={profileTheme.primary} />
                  </View>
                  <Text style={[styles.cardTitle, { color: profileTheme.primaryDark }]}>Pour toi</Text>
                  <Text style={[styles.cardName, { color: profileTheme.primary }]}>{birthday.name}</Text>
                  <View style={[styles.cardDatePill, { backgroundColor: profileTheme.surface }]}>
                    <CalendarDays size={14} color={profileTheme.primaryDark} />
                    <Text style={[styles.cardDate, { color: profileTheme.primaryDark }]}>
                      {nextDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </Text>
                  </View>

                  <View style={styles.cardDivider}>
                    <View style={[styles.cardDividerLine, { backgroundColor: profileTheme.border }]} />
                    <Heart size={15} color={profileTheme.primary} fill={profileTheme.primary} />
                    <View style={[styles.cardDividerLine, { backgroundColor: profileTheme.border }]} />
                  </View>

                  {cardPhotoUri ? (
                    <View style={[styles.greetingPhotoFrame, { backgroundColor: profileTheme.surface, borderColor: profileTheme.border }]}>
                      <Image
                        source={{ uri: cardPhotoUri }}
                        style={styles.greetingPhoto}
                        onLoad={() => setCardPhotoReady(true)}
                        onError={() => setCardPhotoReady(false)}
                      />
                    </View>
                  ) : (
                    <View style={[styles.greetingPhoto, styles.greetingPhotoPlaceholder, { backgroundColor: profileTheme.surface }]}>
                      <CakeSlice size={43} color={profileTheme.primary} strokeWidth={1.4} />
                      <Text style={[styles.cardPhotoCaption, { color: profileTheme.primaryDark }]}>Une belle journée rien qu’à toi</Text>
                    </View>
                  )}

                  <View style={[styles.cardMessagePanel, { backgroundColor: profileTheme.surface }]}>
                    <Text style={[styles.cardMessage, { color: THEME.colors.textPrimary }]}>{wishText}</Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <Heart size={13} color={profileTheme.primary} fill={profileTheme.primary} />
                    <Text style={[styles.cardFooterText, { color: profileTheme.primaryDark }]}>Profite pleinement de ta journée</Text>
                    <Heart size={13} color={profileTheme.primary} fill={profileTheme.primary} />
                  </View>
                </View>
              </View>
            </ViewShot>
            {!cardPhotoReady && cardPhotoUri && (
              <Text accessibilityRole="alert" style={styles.secondary}>Chargement de la photo…</Text>
            )}
            <TouchableOpacity
              style={[styles.cardShareButton, { backgroundColor: profileTheme.primary }, (!cardPhotoReady || sharingCard) && styles.disabledButton]}
              onPress={() => void shareGreetingCard()}
              disabled={!cardPhotoReady || sharingCard}
              accessibilityRole="button"
              accessibilityLabel="Créer et partager la carte de vœux en image"
            >
              <Share2 size={18} color="#FFFFFF" />
              <Text style={styles.cardShareText}>{sharingCard ? 'Création de la carte…' : 'Partager la carte en image'}</Text>
            </TouchableOpacity>
          </>
        )}

        <Text accessibilityRole="header" style={styles.heading}>Rappels annuels</Text>
        <TouchableOpacity
          accessibilityRole="button" accessibilityLabel="Mode des rappels"
          accessibilityState={{ expanded: showModes }} style={[styles.mode, { backgroundColor: profileTheme.surface, borderColor: profileTheme.border }]}
          onPress={() => setShowModes(value => !value)} disabled={saving}
        >
          <Text style={styles.modeText}>{MODES[draft.mode]}</Text>
          <ChevronDown size={21} color={profileTheme.primaryDark} />
        </TouchableOpacity>
        {showModes && (Object.keys(MODES) as ReminderMode[]).map(mode => (
          <TouchableOpacity
            key={mode} style={[styles.modeChoice, { backgroundColor: profileTheme.card }]} accessibilityRole="button"
            accessibilityState={{ selected: draft.mode === mode }}
            onPress={() => { setDraft(current => ({ ...current, mode })); setShowModes(false); }}
          >
            <Text style={styles.modeText}>{MODES[mode]}</Text>
          </TouchableOpacity>
        ))}

        {draft.mode !== 'disabled' && rules.map(rule => {
          const isEve = rule.type === 'day_before';
          const time = isEve ? eveTime : dayTime;
          const parsed = draft.mode === 'custom' ? parseReminderTime(time) : rule;
          const occurrence = rule.enabled && parsed
            ? getNextReminderOccurrence(birthday.birthMonth, birthday.birthDay, rule.type, parsed.hour, parsed.minute)
            : null;
          return (
            <View key={rule.type} style={[styles.rule, { backgroundColor: profileTheme.card, borderColor: profileTheme.border }]}>
              <CalendarDays size={22} color={THEME.colors.textSecondary} />
              <View style={styles.copy}>
                <Text style={styles.ruleTitle}>{rule.label}</Text>
                <Text style={styles.secondary}>
                  {occurrence && parsed ? `${shortDate(occurrence)}${draft.mode === 'custom' ? '' : ` · ${formatReminderTime(parsed.hour, parsed.minute)}`}`
                    : rule.enabled ? 'Horaire à vérifier' : 'Désactivé'}
                </Text>
              </View>
              {draft.mode === 'custom' && rule.enabled && (
                <ReminderTimeInput label={`Horaire · ${rule.label}`} value={time} onChange={isEve ? setEveTime : setDayTime} disabled={saving} />
              )}
              <Switch
                accessibilityLabel={`Activer le rappel · ${rule.label}`}
                value={rule.enabled}
                disabled={draft.mode !== 'custom' || saving}
                onValueChange={enabled => setDraft(current => isEve
                  ? { ...current, customDayBeforeEnabled: enabled }
                  : { ...current, customSameDayEnabled: enabled })}
                trackColor={{ false: profileTheme.border, true: profileTheme.primary }}
              />
            </View>
          );
        })}
        {isLeapBirthday && <Text style={styles.secondary}>Cet anniversaire est fêté le 28 février les années non bissextiles.</Text>}
        {variableReminders && <Text style={styles.secondary}>Les rappels dont la date varie sont programmés pour {VARIABLE_REMINDER_YEARS} ans et renouvelés à l’ouverture de l’application.</Text>}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {status && <Text accessibilityLiveRegion="polite" style={styles.secondary}>{STATUS_TEXT[status]}</Text>}
        {birthday.notes && <View style={styles.notes}><Text style={styles.ruleTitle}>Note</Text><Text style={styles.secondary}>{birthday.notes}</Text></View>}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: profileTheme.background }]}>
        <TouchableOpacity style={[styles.save, { backgroundColor: profileTheme.primary }]} accessibilityRole="button" disabled={saving} onPress={save}>
          <Text style={styles.saveText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 12 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  toolbarActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.colors.surface },
  wishCard: { backgroundColor: THEME.colors.cardBackground, borderRadius: 18, borderWidth: 1, borderColor: THEME.colors.border, padding: 14, marginBottom: 8 },
  wishInput: { minHeight: 110, color: THEME.colors.textPrimary, fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  wishHint: { color: THEME.colors.textSecondary, fontSize: 13, marginBottom: 8 },
  wishActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  wishSecondary: { paddingHorizontal: 14, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, backgroundColor: THEME.colors.surface },
  wishSecondaryText: { color: THEME.colors.textPrimary, fontWeight: '700' },
  wishPrimary: { paddingHorizontal: 16, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, backgroundColor: THEME.colors.primary },
  wishPrimaryText: { color: '#FFFFFF', fontWeight: '800' },
  cardPhotoLabel: { color: THEME.colors.textPrimary, fontSize: 14, fontWeight: '700' },
  cardPhotoControls: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 4 },
  cardPhotoThumbnail: { width: 52, height: 52, borderRadius: 16 },
  cardPhotoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.colors.surface },
  cardPhotoRemove: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: THEME.colors.dangerBg },
  cardCapture: { width: '100%', overflow: 'hidden', borderRadius: 26 },
  greetingCard: { padding: 9, overflow: 'hidden', borderRadius: 26, borderWidth: 1 },
  cardInnerFrame: { minHeight: 570, paddingHorizontal: 20, paddingTop: 33, paddingBottom: 29, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 20, borderWidth: 1 },
  cardOrnamentTopLeft: { position: 'absolute', top: 12, left: 12 },
  cardOrnamentTopRight: { position: 'absolute', top: 15, right: 14 },
  cardOrnamentBottomLeft: { position: 'absolute', bottom: 13, left: 16 },
  cardOrnamentBottomRight: { position: 'absolute', bottom: 10, right: 12 },
  cardEyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  cardEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.8, textAlign: 'center' },
  cardTitle: { fontSize: 25, lineHeight: 31, fontWeight: '500', textAlign: 'center', marginTop: 8 },
  cardName: { maxWidth: '100%', fontSize: 31, lineHeight: 38, fontWeight: '900', textAlign: 'center', marginTop: 1 },
  cardDatePill: { minHeight: 29, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 15, marginTop: 8 },
  cardDate: { fontSize: 12, fontWeight: '700' },
  cardDivider: { width: '72%', flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 18 },
  cardDividerLine: { height: 1, flex: 1 },
  greetingPhotoFrame: { padding: 5, borderWidth: 1, borderRadius: 22, marginBottom: 15 },
  greetingPhoto: { width: 190, height: 145, borderRadius: 17, resizeMode: 'cover' },
  greetingPhotoPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 },
  cardPhotoCaption: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  cardMessagePanel: { width: '100%', paddingHorizontal: 15, paddingVertical: 16, borderRadius: 17, marginTop: 1 },
  cardMessage: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 17 },
  cardFooterText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textAlign: 'center' },
  cardShareButton: { minHeight: 48, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 16, backgroundColor: THEME.colors.primary },
  cardShareText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  avatar: { width: 78, height: 78, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.colors.lavender },
  avatarImage: { width: '100%', height: '100%', borderRadius: 24 },
  initial: { color: THEME.colors.textPrimary, fontSize: 34, fontWeight: '800' },
  copy: { flex: 1 },
  name: { color: THEME.colors.textPrimary, fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  date: { color: THEME.colors.textPrimary, fontSize: 18 },
  secondary: { color: THEME.colors.textSecondary, fontSize: 14, lineHeight: 20 },
  heading: { color: THEME.colors.textPrimary, fontSize: 25, fontWeight: '800', letterSpacing: -0.4 },
  mode: { minHeight: 50, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: THEME.colors.border, backgroundColor: THEME.colors.surface },
  modeChoice: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: THEME.colors.cardBackground },
  modeText: { color: THEME.colors.textPrimary, fontSize: 16, fontWeight: '700' },
  rule: { minHeight: 70, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 1, borderColor: THEME.colors.border, backgroundColor: THEME.colors.cardBackground },
  ruleTitle: { color: THEME.colors.textPrimary, fontSize: 16, fontWeight: '800' },
  notes: { gap: 4, paddingVertical: 6 },
  error: { color: THEME.colors.danger, fontSize: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, backgroundColor: THEME.colors.background },
  save: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: THEME.colors.primary },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
