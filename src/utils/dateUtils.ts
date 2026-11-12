/**
 * Fonctions pures et déterministes de calcul des dates d'anniversaire et des rappels.
 * Respecte strictement les règles du PRD :
 * - Mois humain 1..12
 * - Veille calculée en jours calendaires (1er janvier => 31 décembre)
 * - 29 février reporté au 28 février en année non bissextile
 * - Veille du 1er mars change selon l'année (29 février en bissextile, 28 février sinon)
 * - Prochaine occurrence et calcul des jours restants
 * - Passage automatique à l'année suivante après l'échéance
 */

export const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Résout le jour effectif d'un anniversaire pour une année donnée
 * (ex: 29 février => 28 février en année non bissextile).
 */
export function resolveEffectiveBirthday(
  birthMonth: number,
  birthDay: number,
  targetYear: number
): { year: number; month: number; day: number } {
  if (birthMonth === 2 && birthDay === 29) {
    const leap = isLeapYear(targetYear);
    return {
      year: targetYear,
      month: 2,
      day: leap ? 29 : 28,
    };
  }

  return {
    year: targetYear,
    month: birthMonth,
    day: birthDay,
  };
}

/**
 * Calcule la date calendaire de la veille pour une année cible donnée.
 */
export function calculateEveDate(
  birthMonth: number,
  birthDay: number,
  targetYear: number
): { year: number; month: number; day: number } {
  const effective = resolveEffectiveBirthday(birthMonth, birthDay, targetYear);
  const dateObj = new Date(effective.year, effective.month - 1, effective.day);
  dateObj.setDate(dateObj.getDate() - 1);

  return {
    year: dateObj.getFullYear(),
    month: dateObj.getMonth() + 1,
    day: dateObj.getDate(),
  };
}

/**
 * Calcule la prochaine date calendaire d'anniversaire (à minuit)
 * Règle PRD : Un anniversaire du jour reste affiché comme "Aujourd'hui".
 */
export function getNextBirthdayDate(
  birthMonth: number,
  birthDay: number,
  referenceDate: Date = new Date()
): { nextDate: Date; daysRemaining: number; isToday: boolean } {
  const currentYear = referenceDate.getFullYear();
  const todayMidnight = new Date(currentYear, referenceDate.getMonth(), referenceDate.getDate());

  for (let offset = 0; offset <= 2; offset++) {
    const candidateYear = currentYear + offset;
    const eff = resolveEffectiveBirthday(birthMonth, birthDay, candidateYear);
    const candidateDate = new Date(eff.year, eff.month - 1, eff.day);

    const diffMs = candidateDate.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { nextDate: candidateDate, daysRemaining: 0, isToday: true };
    }

    if (diffDays > 0) {
      return { nextDate: candidateDate, daysRemaining: diffDays, isToday: false };
    }
  }

  const fallbackDate = new Date(currentYear + 1, birthMonth - 1, birthDay);
  return { nextDate: fallbackDate, daysRemaining: 365, isToday: false };
}

/**
 * Calcule la prochaine occurrence exacte d'un rappel (avec heure et minute).
 */
export function getNextReminderOccurrence(
  birthMonth: number,
  birthDay: number,
  type: 'same_day' | 'day_before',
  hour: number,
  minute: number,
  referenceDate: Date = new Date()
): Date {
  const currentYear = referenceDate.getFullYear();

  for (let offset = 0; offset <= 2; offset++) {
    const yearCandidate = currentYear + offset;
    let scheduledDateInfo: { year: number; month: number; day: number };

    if (type === 'day_before') {
      scheduledDateInfo = calculateEveDate(birthMonth, birthDay, yearCandidate);
    } else {
      scheduledDateInfo = resolveEffectiveBirthday(birthMonth, birthDay, yearCandidate);
    }

    const candidateDate = new Date(
      scheduledDateInfo.year,
      scheduledDateInfo.month - 1,
      scheduledDateInfo.day,
      hour,
      minute,
      0,
      0
    );

    if (candidateDate.getTime() > referenceDate.getTime()) {
      return candidateDate;
    }
  }

  return new Date(referenceDate.getTime() + 365 * 24 * 3600 * 1000);
}

/**
 * Formatage lisible en français
 */
export function formatFrenchDateTime(date: Date): string {
  const days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const dayPrefix = day === 1 ? '1er' : `${day}`;
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${dayName} ${dayPrefix} ${monthName} ${year} à ${hours}h${minutes}:${seconds}`;
}

/**
 * Calcule l'âge que la personne atteindra à la prochaine occurrence
 */
export function calculateNextAge(birthYear: number | undefined, nextOccurrence: Date): number | null {
  if (!birthYear || birthYear <= 0) return null;
  const age = nextOccurrence.getFullYear() - birthYear;
  return age >= 0 ? age : null;
}
