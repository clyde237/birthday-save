import { buildWishMessage, type WishInput } from './src/utils/wishMessages';
import { RELATIONS, type Relation } from './src/constants/relations';

const PRONOUNS = /(?<![\p{L}])(?:tu|te|toi|ton|ta|tes|vous|votre|vos)(?![\p{L}])|(?<![\p{L}])t’/iu;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const base: WishInput = {
  id: 'bday_test_1',
  name: 'Awa',
  age: 31,
  year: 2027,
  relation: 'ami',
};

assert(buildWishMessage(base) === buildWishMessage({ ...base }), 'Message should be deterministic');

const messages = new Set<string>();
for (let year = 2027; year < 2057; year++) {
  messages.add(buildWishMessage({ ...base, year }));
}
assert(messages.size === 30, `Expected 30 unique annual messages, got ${messages.size}`);

assert(
  buildWishMessage(base, 0) !== buildWishMessage(base, 1),
  'Another idea should produce a different message',
);

for (const relation of [...RELATIONS, undefined] as (Relation | undefined)[]) {
  for (const age of [null, 1, 18, 31]) {
    for (let shuffle = 0; shuffle < 12; shuffle++) {
      const message = buildWishMessage({ id: 'test', name: 'Paul', age, year: 2030, relation }, shuffle);
      assert(!message.includes('{') && !message.includes('}'), `Unreplaced template marker: ${message}`);
      assert(message.includes('Paul'), 'The message should include the person name');
    }
  }
}

for (const relation of ['collegue', 'autre', undefined] as (Relation | undefined)[]) {
  for (let shuffle = 0; shuffle < 12; shuffle++) {
    const message = buildWishMessage({ id: 'test', name: 'Paul', age: null, year: 2030, relation }, shuffle);
    assert(!PRONOUNS.test(message.replace('Paul', '')), `Unexpected familiar pronoun: ${message}`);
  }
}

console.log('All wish message tests passed.');
