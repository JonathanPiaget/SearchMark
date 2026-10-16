import { describe, expect, it } from 'vitest';
import { matchByTitle } from '@/utils/matchByTitle';

const titled = (...titles: string[]) =>
	titles.map((title, i) => ({ id: String(i), title }));

describe('matchByTitle', () => {
	it.each([true, false])('returns [] for a blank query (fuzzy=%s)', (fuzzy) => {
		expect(matchByTitle(titled('a'), '  ', fuzzy, 10)).toEqual([]);
	});

	it('exact mode matches case-insensitive substrings with their indexes', () => {
		const items = titled('Work Projects', 'Homework', 'Personal');

		const results = matchByTitle(items, 'WORK', false, 10);

		expect(results.map((r) => r.item.title)).toEqual([
			'Work Projects',
			'Homework',
		]);
		expect(results[1]?.indexes).toEqual([4, 5, 6, 7]);
	});

	it('exact mode ignores accents and indexes the original title', () => {
		const results = matchByTitle(
			titled('Mon Développement'),
			'developpement',
			false,
			10,
		);

		expect(results[0]?.indexes).toEqual([
			4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
		]);
	});

	it('exact mode matches an accented query against a decomposed title', () => {
		const title = 'Cafe\u0301 noir';

		const results = matchByTitle(titled(title), 'café', false, 10);

		expect(results[0]?.indexes).toEqual([0, 1, 2, 3, 4]);
	});

	it('fuzzy mode accepts a decomposed query', () => {
		const results = matchByTitle(titled('Café'), 'cafe\u0301', true, 10);

		expect(results).toHaveLength(1);
	});

	it('fuzzy mode highlights a decomposed accent with its letter', () => {
		const results = matchByTitle(
			titled('Mon re\u0301sume\u0301'),
			'resume',
			true,
			10,
		);

		expect(results[0]?.indexes).toEqual([4, 5, 6, 7, 8, 9, 10, 11]);
	});

	it('fuzzy mode matches scattered letters and returns indexes', () => {
		const items = titled('kotlin-lang-lambda', 'javascript-tutorial');

		const results = matchByTitle(items, 'ktln', true, 10);

		expect(results).toHaveLength(1);
		expect(results[0]?.item.title).toBe('kotlin-lang-lambda');
		expect(results[0]?.indexes?.length).toBeGreaterThan(0);
	});

	it('fuzzy mode drops matches below the threshold', () => {
		expect(matchByTitle(titled('xyz'), 'abc', true, 10)).toHaveLength(0);
	});

	it('fuzzy mode appends typo-only matches after fuzzysort matches', () => {
		const items = titled('Kotlen notes', 'Kotlin');

		const results = matchByTitle(items, 'kotlin', true, 10);

		expect(results.map((r) => r.item.title)).toEqual([
			'Kotlin',
			'Kotlen notes',
		]);
		expect(results[1]?.indexes).toEqual([0, 1, 2, 3, 4, 5]);
	});

	it('fuzzy mode respects limit across both tiers', () => {
		const items = titled('Kotlen 1', 'Kotlin 2', 'Kotlin 3');

		expect(
			matchByTitle(items, 'kotlin', true, 2).map((r) => r.item.title),
		).not.toContain('Kotlen 1');
		expect(matchByTitle(items, 'kotlin', true, 3)).toHaveLength(3);
	});

	it.each([true, false])('caps results at limit (fuzzy=%s)', (fuzzy) => {
		const items = titled(...Array.from({ length: 30 }, (_, i) => `alpha ${i}`));

		expect(matchByTitle(items, 'alpha', fuzzy, 12)).toHaveLength(12);
	});
});
