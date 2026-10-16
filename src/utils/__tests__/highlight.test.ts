import { describe, expect, it } from 'vitest';
import { highlightByIndexes } from '@/utils/highlight';

describe('highlightByIndexes', () => {
	it.each([[], null, undefined])(
		'returns a single non-highlighted part when indexes are %s',
		(indexes) => {
			expect(highlightByIndexes('hello', indexes)).toEqual([
				{ text: 'hello', highlighted: false },
			]);
		},
	);

	it('highlights the first character when index 0 is present', () => {
		expect(highlightByIndexes('hello', [0])).toEqual([
			{ text: 'h', highlighted: true },
			{ text: 'ello', highlighted: false },
		]);
	});

	it('groups adjacent indexes into a single highlighted part', () => {
		expect(highlightByIndexes('hello', [1, 2])).toEqual([
			{ text: 'h', highlighted: false },
			{ text: 'el', highlighted: true },
			{ text: 'lo', highlighted: false },
		]);
	});

	it('splits non-adjacent indexes into separate highlighted parts', () => {
		expect(highlightByIndexes('hello', [0, 2, 4])).toEqual([
			{ text: 'h', highlighted: true },
			{ text: 'e', highlighted: false },
			{ text: 'l', highlighted: true },
			{ text: 'l', highlighted: false },
			{ text: 'o', highlighted: true },
		]);
	});

	it('highlights every character when all indexes are provided', () => {
		expect(highlightByIndexes('hi', [0, 1])).toEqual([
			{ text: 'hi', highlighted: true },
		]);
	});

	it('ignores out-of-range indexes', () => {
		expect(highlightByIndexes('hi', [5])).toEqual([
			{ text: 'hi', highlighted: false },
		]);
	});
});
