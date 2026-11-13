import type { Relation } from '../constants/relations';

export interface WishInput {
  id: string;
  name: string;
  age: number | null;
  year: number;
  relation?: Relation;
}

const OPENINGS = [
  'Joyeux anniversaire {name} ! 🎂',
  'Bon anniversaire {name} ! 🎉',
  'Happy birthday {name} ! 🥳',
  'Un très joyeux anniversaire {name} ! 🎁',
  'Aujourd’hui, on fête {name} ! 🎈',
  'Bon anniversaire, {name} ! 🌟',
];

const AGE_LINES = [
  '{age} ans aujourd’hui, ça se fête !',
  'Déjà {age} ans, et toujours autant de raisons de célébrer.',
  '{age} ans : une belle étape de plus.',
  'Cap sur les {age} ans !',
];

const MILESTONE_AGES = new Set([18, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
const MILESTONE_LINES = [
  'Un cap important : {age} ans ! 🎊',
  '{age} ans, une étape qui mérite une vraie fête !',
  '{age} ans aujourd’hui : bravo pour ce beau parcours !',
];

type BodyKey = Relation | 'aucune';

const BODIES: Record<BodyKey, string[]> = {
  famille: [
    'Je te souhaite une journée remplie de tendresse et de rires.',
    'Que cette nouvelle année t’apporte santé, joie et sérénité.',
    'Tu comptes énormément pour moi, et c’est un bonheur de te fêter aujourd’hui.',
    'Que tous tes projets prennent vie cette année.',
    'Merci d’être là, toujours, dans les bons comme dans les moments plus difficiles.',
    'Profite de chaque instant de cette journée, tu le mérites.',
  ],
  ami: [
    'Je te souhaite une journée de folie, avec plein de bonnes surprises.',
    'Que cette année soit remplie de rires, de voyages et de belles aventures.',
    'Merci pour tous les bons moments, et vivement les prochains !',
    'Profite bien de ta journée, tu le mérites largement.',
    'Que cette nouvelle année t’apporte tout ce que tu désires.',
    'Que la fête soit belle et que le gâteau soit énorme.',
  ],
  partenaire: [
    'Je te souhaite une journée aussi belle que tout ce que tu m’apportes chaque jour.',
    'Chaque année à tes côtés est un cadeau.',
    'Que cette nouvelle année nous réserve encore plein de beaux moments.',
    'Tu mérites tout le bonheur du monde, aujourd’hui et chaque jour.',
    'Merci d’être toi, tout simplement.',
    'Plein de tendresse pour toi aujourd’hui et toujours.',
  ],
  collegue: [
    'Excellente journée et belle année à venir.',
    'Tous mes vœux de réussite et de bonheur pour cette nouvelle année.',
    'Que cette année apporte santé, sérénité et belles réussites.',
    'Une très belle journée, remplie de bons moments.',
    'Meilleurs vœux de joie et de réussite pour l’année qui commence.',
    'Avec tous mes vœux pour une année agréable et réussie.',
  ],
  autre: [
    'Excellente journée, remplie de sourires et de belles surprises.',
    'Tous mes vœux de bonheur et de santé pour cette nouvelle année.',
    'Que cette année apporte plein de belles choses.',
    'Belle fête, et que cette journée soit pleine de bons moments.',
    'Une année riche en joie, en projets et en rencontres.',
    'Bonne journée et meilleurs vœux.',
  ],
  aucune: [
    'Excellente journée, remplie de sourires et de belles surprises.',
    'Tous mes vœux de bonheur et de santé pour cette nouvelle année.',
    'Que cette année apporte plein de belles choses.',
    'Belle fête, et que cette journée soit pleine de bons moments.',
    'Une année riche en joie, en projets et en rencontres.',
    'Bonne journée et meilleurs vœux.',
  ],
};

const CLOSINGS_TU = [
  'Je pense bien à toi. 💛',
  'On se voit bientôt, j’espère !',
  'Je t’embrasse fort. 🤗',
  'Prends bien soin de toi.',
  'À très vite !',
];
const CLOSINGS_NEUTRE = [
  'Bonne fête ! 🎊',
  'Très belle journée !',
  'Que cette journée soit mémorable !',
  'Bien chaleureusement.',
  'À bientôt !',
];

function hash(text: string): number {
  let value = 5381;
  for (let index = 0; index < text.length; index++) {
    value = ((value << 5) + value + text.charCodeAt(index)) >>> 0;
  }
  return value;
}

function pick<T>(list: T[], id: string, slot: string, year: number, shuffle: number): T {
  return list[(hash(`${id}:${slot}`) + year + shuffle) % list.length];
}

export function buildWishMessage(input: WishInput, shuffle = 0): string {
  const { id, name, age, year, relation } = input;
  const key: BodyKey = relation ?? 'aucune';
  const closings = relation === 'famille' || relation === 'ami' || relation === 'partenaire'
    ? CLOSINGS_TU
    : CLOSINGS_NEUTRE;

  const lines: string[] = [];
  if (age !== null && age > 0) {
    const ageLines = MILESTONE_AGES.has(age) ? MILESTONE_LINES : AGE_LINES;
    lines.push(pick(ageLines, id, 'age', year, shuffle));
  }
  lines.push(pick(BODIES[key], id, 'body', year, shuffle));
  lines.push(pick(closings, id, 'closing', year, shuffle));

  const opening = pick(OPENINGS, id, 'opening', year, shuffle);
  return `${opening}\n\n${lines.join(' ')}`
    .replace(/\{name\}/g, name)
    .replace(/\{age\}/g, String(age ?? ''));
}
