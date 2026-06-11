import { describe, expect, it } from 'vitest';
import {
	highlightByIndexes,
	highlightBySubstring,
	highlightText,
} from '@/utils/highlight';

describe('highlightByIndexes', () => {
	it('returns a single non-highlighted part when there are no indexes', () => {
		expect(highlightByIndexes('hello', [])).toEqual([
			{ text: 'hello', highlighted: false },
		]);
	});

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

describe('highlightBySubstring', () => {
	it('returns a single non-highlighted part when the query is empty', () => {
		expect(highlightBySubstring('hello', '')).toEqual([
			{ text: 'hello', highlighted: false },
		]);
	});

	it('returns a single non-highlighted part when the query is whitespace only', () => {
		expect(highlightBySubstring('hello', '   ')).toEqual([
			{ text: 'hello', highlighted: false },
		]);
	});

	it('highlights the matching substring case-insensitively', () => {
		expect(highlightBySubstring('Hello World', 'world')).toEqual([
			{ text: 'Hello ', highlighted: false },
			{ text: 'World', highlighted: true },
		]);
	});

	it('preserves the original casing in the highlighted part', () => {
		expect(highlightBySubstring('FooBar', 'foo')).toEqual([
			{ text: 'Foo', highlighted: true },
			{ text: 'Bar', highlighted: false },
		]);
	});

	it('highlights every occurrence of the query', () => {
		expect(highlightBySubstring('a-a-a', 'a')).toEqual([
			{ text: 'a', highlighted: true },
			{ text: '-', highlighted: false },
			{ text: 'a', highlighted: true },
			{ text: '-', highlighted: false },
			{ text: 'a', highlighted: true },
		]);
	});

	it('returns a single non-highlighted part when there is no match', () => {
		expect(highlightBySubstring('hello', 'xyz')).toEqual([
			{ text: 'hello', highlighted: false },
		]);
	});
});

describe('highlightText', () => {
	it('uses index-based highlighting when indexes are provided', () => {
		expect(highlightText('hello', 'ignored', [0])).toEqual([
			{ text: 'h', highlighted: true },
			{ text: 'ello', highlighted: false },
		]);
	});

	it('falls back to substring highlighting when indexes are empty', () => {
		expect(highlightText('Hello World', 'world', [])).toEqual([
			{ text: 'Hello ', highlighted: false },
			{ text: 'World', highlighted: true },
		]);
	});

	it('falls back to substring highlighting when indexes are null', () => {
		expect(highlightText('Hello World', 'hello', null)).toEqual([
			{ text: 'Hello', highlighted: true },
			{ text: ' World', highlighted: false },
		]);
	});

	it('falls back to substring highlighting when indexes are undefined', () => {
		expect(highlightText('Hello World', 'hello')).toEqual([
			{ text: 'Hello', highlighted: true },
			{ text: ' World', highlighted: false },
		]);
	});
});
