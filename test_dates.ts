import {
  isLeapYear,
  calculateEveDate,
  resolveEffectiveBirthday,
  getNextReminderOccurrence,
  calculateNextAge,
} from './src/utils/dateUtils';

function runAssertions() {
  console.log('--- Test 1 : Années bissextiles ---');
  if (!isLeapYear(2024)) throw new Error('2024 doit être bissextile');
  if (isLeapYear(2025)) throw new Error('2025 ne doit pas être bissextile');
  if (isLeapYear(2026)) throw new Error('2026 ne doit pas être bissextile');
  if (isLeapYear(2100)) throw new Error('2100 ne doit pas être bissextile');
  if (!isLeapYear(2000)) throw new Error('2000 doit être bissextile');
  console.log('✅ Années bissextiles validées.');

  console.log('\n--- Test 2 : Maman 2 février (scénario PRD) ---');
  const eveMaman = calculateEveDate(2, 2, 2027);
  if (eveMaman.month !== 2 || eveMaman.day !== 1) {
    throw new Error(`Veille de Maman attendue 1 fév, obtenu: ${eveMaman.day}/${eveMaman.month}`);
  }
  console.log('✅ Veille de Maman: 1er février');

  console.log('\n--- Test 3 : 1er Janvier (Veille le 31 décembre) ---');
  const eveJan1 = calculateEveDate(1, 1, 2027);
  if (eveJan1.year !== 2026 || eveJan1.month !== 12 || eveJan1.day !== 31) {
    throw new Error(`Veille du 1er jan 2027 attendue 31/12/2026, obtenu: ${eveJan1.day}/${eveJan1.month}/${eveJan1.year}`);
  }
  console.log('✅ Veille du 1er janvier 2027: 31 décembre 2026');

  console.log('\n--- Test 4 : 29 Février ---');
  // En 2027 (non bissextile), reporté au 28 février
  const bday2027 = resolveEffectiveBirthday(2, 29, 2027);
  if (bday2027.day !== 28) throw new Error('29 fév 2027 doit être reporté au 28 fév');
  const eve2027 = calculateEveDate(2, 29, 2027);
  if (eve2027.day !== 27) throw new Error('Veille du 29 fév en 2027 doit être le 27 fév');

  // En 2028 (bissextile), 29 février
  const bday2028 = resolveEffectiveBirthday(2, 29, 2028);
  if (bday2028.day !== 29) throw new Error('29 fév 2028 doit rester le 29 fév');
  const eve2028 = calculateEveDate(2, 29, 2028);
  if (eve2028.day !== 28) throw new Error('Veille du 29 fév en 2028 doit être le 28 fév');
  console.log('✅ 29 février géré avec précision en années ordinaires et bissextiles.');

  console.log('\n--- Test 5 : 1er Mars ---');
  const eveMarchNonLeap = calculateEveDate(3, 1, 2027);
  if (eveMarchNonLeap.month !== 2 || eveMarchNonLeap.day !== 28) {
    throw new Error('Veille du 1er mars 2027 doit être le 28 fév');
  }
  const eveMarchLeap = calculateEveDate(3, 1, 2028);
  if (eveMarchLeap.month !== 2 || eveMarchLeap.day !== 29) {
    throw new Error('Veille du 1er mars 2028 doit être le 29 fév');
  }
  console.log('✅ Veille du 1er mars dynamique selon bissextile.');

  console.log('\n--- Test 6 : Prochaine occurrence et bascule après échéance passée ---');
  // Date de référence : 12 novembre 2026 à 10h00
  const refDate = new Date(2026, 10, 12, 10, 0, 0); // 12 nov 2026
  // Anniversaire le 12 novembre à 09h00 (déjà passé aujourd'hui !)
  const pastToday = getNextReminderOccurrence(11, 12, 'same_day', 9, 0, refDate);
  if (pastToday.getFullYear() !== 2027) {
    throw new Error(`Doit basculer en 2027, obtenu: ${pastToday.getFullYear()}`);
  }
  // Anniversaire le 12 novembre à 11h00 (plus tard aujourd'hui)
  const futureToday = getNextReminderOccurrence(11, 12, 'same_day', 11, 0, refDate);
  if (futureToday.getFullYear() !== 2026) {
    throw new Error(`Doit être en 2026, obtenu: ${futureToday.getFullYear()}`);
  }
  console.log('✅ Bascule automatique à l’année suivante vérifiée.');

  console.log('\n--- Test 7 : Calcul de l’âge ---');
  const age = calculateNextAge(1960, new Date(2027, 1, 2));
  if (age !== 67) throw new Error(`Age attendu 67, obtenu ${age}`);
  console.log('✅ Calcul de l’âge validé.');

  console.log('\n🎉 TOUS LES TESTS DE DATE DU PRD SONT VALIDES !');
}

runAssertions();
