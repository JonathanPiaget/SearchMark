import { describe, expect, it } from 'vitest';
import { matchByTitle } from '@/utils/matchByTitle';

const titled = (...titles: string[]) =>
	titles.map((title, i) => ({ id: String(i), title }));

describe('matchByTitle', () => {
	it.each([true, false])('returns [] for a blank query (fuzzy=%s)', (fuzzy) => {
		expect(matchByTitle(titled('a'), '  ', fuzzy, 10)).toEqual([]);
	});

	it('exact mode matches case-insensitive substrings with null indexes', () => {
		const items = titled('Work Projects', 'Homework', 'Personal');

		const results = matchByTitle(items, 'WORK', false, 10);

		expect(results.map((r) => r.item.title)).toEqual([
			'Work Projects',
			'Homework',
		]);
		expect(results[0]?.indexes).toBeNull();
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

	it.each([true, false])('caps results at limit (fuzzy=%s)', (fuzzy) => {
		const items = titled(...Array.from({ length: 30 }, (_, i) => `alpha ${i}`));

		expect(matchByTitle(items, 'alpha', fuzzy, 12)).toHaveLength(12);
	});
});
