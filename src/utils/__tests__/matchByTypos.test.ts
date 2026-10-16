import { describe, expect, it } from 'vitest';
import { matchWordsWithTypos } from '@/utils/matchByTypos';

const range = (from: number, to: number) =>
	Array.from({ length: to - from }, (_, i) => from + i);

describe('matchWordsWithTypos', () => {
	it.each([
		['swapped letters', 'kotiln'],
		['wrong letter', 'kotlen'],
		['extra letter', 'kotlinn'],
	])('accepts one typo on a 5+ letter word: %s', (_, query) => {
		expect(matchWordsWithTypos('Kotlin', query)).toEqual(range(0, 6));
	});

	it('accepts a missing letter', () => {
		expect(matchWordsWithTypos('JavaScript guide', 'jvascript')).toEqual(
			range(0, 10),
		);
	});

	it('accepts two typos on a 9+ letter word', () => {
		expect(matchWordsWithTypos('Developpement', 'devlopement')).not.toBeNull();
	});

	it('rejects three typos on a 9+ letter word', () => {
		expect(matchWordsWithTypos('Developpement', 'devlopemnet')).toBeNull();
	});

	it('rejects two typos on a shorter word', () => {
		expect(matchWordsWithTypos('Kotlin', 'kitlen')).toBeNull();
	});

	it.each([
		['5 letters: 1 typo', 'Plane', 'plant', true],
		['8 letters: not 2 typos', 'Notebook', 'notabuok', false],
		['9 letters: 2 typos', 'Notebooks', 'notabuoks', true],
	])('typo budget boundary, %s', (_, title, query, matches) => {
		expect(matchWordsWithTypos(title, query) !== null).toBe(matches);
	});

	it('allows no typo under 5 letters', () => {
		expect(matchWordsWithTypos('dev tools', 'deb')).toBeNull();
	});

	it('matches query words in any order and highlights each whole word', () => {
		expect(matchWordsWithTypos('Kotlin lambdas', 'lambdsa kotiln')).toEqual(
			range(0, 14).filter((i) => i !== 6),
		);
	});

	it('rejects a title missing one of the query words', () => {
		expect(matchWordsWithTypos('Kotlin lambdas', 'kotlin python')).toBeNull();
	});

	it('matches a word still being typed', () => {
		expect(matchWordsWithTypos('Kotlin lambdas', 'kotlen la')).toEqual(
			range(0, 14).filter((i) => i !== 6),
		);
	});

	it('ignores accents', () => {
		expect(matchWordsWithTypos('Développement web', 'devloppement')).toEqual(
			range(0, 13),
		);
	});

	it('highlights a decomposed title word with its combining marks', () => {
		expect(matchWordsWithTypos('Mon résumé', 'resmue')).toEqual(range(4, 12));
	});

	it('returns null for a query without words', () => {
		expect(matchWordsWithTypos('Kotlin', '--')).toBeNull();
	});
});
