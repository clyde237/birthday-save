import { validateBirthdayInput } from './src/database/birthdayRepository';
import { getNextBirthdayDate, calculateNextAge } from './src/utils/dateUtils';

function runLot2Tests() {
  console.log('--- Test Lot 2 : Validation des entrées ---');

  // 1. Nom vide
  const err1 = validateBirthdayInput({ name: '  ', birthDay: 15, birthMonth: 5 });
  if (!err1.some((e) => e.field === 'name')) throw new Error('Devrait rejeter un nom vide');
  console.log('✅ Validation nom vide OK');

  // 2. Jour impossible (31 avril)
  const err2 = validateBirthdayInput({ name: 'Lucas', birthDay: 31, birthMonth: 4 });
  if (!err2.some((e) => e.field === 'birthDay')) throw new Error('Devrait rejeter le 31 avril');
  console.log('✅ Validation 31 avril rejeté OK');

  // 3. Février > 29
  const err3 = validateBirthdayInput({ name: 'Alex', birthDay: 30, birthMonth: 2 });
  if (!err3.some((e) => e.field === 'birthDay')) throw new Error('Devrait rejeter le 30 février');
  console.log('✅ Validation 30 février rejeté OK');

  // 4. Année future
  const err4 = validateBirthdayInput({ name: 'Bébé', birthDay: 10, birthMonth: 10, birthYear: 2099 });
  if (!err4.some((e) => e.field === 'birthYear')) throw new Error('Devrait rejeter une année future');
  console.log('✅ Validation année future rejetée OK');

  // 5. 29 février avec année non bissextile (ex: 2023)
  const err5 = validateBirthdayInput({ name: 'Camille', birthDay: 29, birthMonth: 2, birthYear: 2023 });
  if (!err5.some((e) => e.field === 'birthYear')) throw new Error('Devrait rejeter 29 fév 2023');
  console.log('✅ Validation 29 fév en année non bissextile OK');

  // 6. Fiche valide sans année (doit être acceptée)
  const err6 = validateBirthdayInput({ name: 'Maman', birthDay: 2, birthMonth: 2 });
  if (err6.length !== 0) throw new Error('Fiche valide sans année rejetée à tort');
  console.log('✅ Fiche valide sans année acceptée');

  // 7. Calcul d'occurrence d'anniversaire du jour
  const today = new Date();
  const resToday = getNextBirthdayDate(today.getMonth() + 1, today.getDate(), today);
  if (!resToday.isToday || resToday.daysRemaining !== 0) {
    throw new Error('Anniversaire du jour mal calculé');
  }
  console.log('✅ Règle PRD "Aujourd\'hui" validée');

  console.log('\n🎉 TOUS LES TESTS DU LOT 2 SONT VALIDÉS !');
}

runLot2Tests();
