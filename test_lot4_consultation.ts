import {
  getBirthdaysByCalendarDay,
  getSortedUpcomingBirthdays,
} from './src/utils/dateUtils';
import { BirthdayProfile } from './src/types';

function birthday(id: string, name: string, birthMonth: number, birthDay: number): BirthdayProfile {
  return {
    id,
    name,
    birthMonth,
    birthDay,
    reminder: {
      mode: 'default',
      customDayBeforeEnabled: true,
      customDayBeforeHour: 19,
      customDayBeforeMinute: 0,
      customSameDayEnabled: true,
      customSameDayHour: 6,
      customSameDayMinute: 0,
    },
  };
}

const profiles = [
  birthday('december', 'Anniversaire du jour', 12, 31),
  birthday('january', 'Nouvel an', 1, 1),
  birthday('february', 'Février', 2, 2),
];
const sorted = getSortedUpcomingBirthdays(profiles, new Date(2026, 11, 31, 12));
const sortedNames = sorted.map((profile) => profile.name);
if (sortedNames.join(',') !== 'Anniversaire du jour,Nouvel an,Février') {
  throw new Error(`Ordre incorrect au passage de l'année : ${sortedNames.join(', ')}`);
}

const twoOnSameDate = [
  birthday('first', 'Alice', 8, 18),
  birthday('second', 'Bob', 8, 18),
  birthday('other', 'Claire', 8, 19),
];
const augustCalendar = getBirthdaysByCalendarDay(twoOnSameDate, 8, 2027);
if (augustCalendar.get(18)?.map((profile) => profile.name).join(',') !== 'Alice,Bob') {
  throw new Error('Le calendrier doit regrouper les anniversaires partageant une date.');
}

const leapCalendar = getBirthdaysByCalendarDay(
  [birthday('leap', 'Anniversaire bissextile', 2, 29)],
  2,
  2028
);
if (leapCalendar.get(29)?.length !== 1) {
  throw new Error('Le calendrier doit afficher le 29 février en année bissextile.');
}

const nonLeapCalendar = getBirthdaysByCalendarDay(
  [birthday('leap', 'Anniversaire reporté', 2, 29)],
  2,
  2027
);
if (nonLeapCalendar.get(28)?.length !== 1) {
  throw new Error('Le calendrier doit reporter le 29 février au 28 en année ordinaire.');
}

console.log('Tests lot 4 réussis : tri annuel et regroupement du calendrier, y compris les années bissextiles.');
