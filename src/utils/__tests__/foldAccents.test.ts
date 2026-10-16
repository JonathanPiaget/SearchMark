import { describe, expect, it } from 'vitest';
import { foldAccents, withCombiningMarks } from '@/utils/foldAccents';

describe('foldAccents', () => {
	it('lowercases and strips accents', () => {
		expect(foldAccents('Éléphant Ça').folded).toBe('elephant ca');
	});

	it('maps a folded span back to the original indexes', () => {
		const { folded, originalIndexes } = foldAccents('Été');
		expect(folded).toBe('ete');
		expect(originalIndexes(1, 3)).toEqual([1, 2]);
	});

	it('covers the combining marks of a decomposed title', () => {
		const { folded, originalIndexes } = foldAccents('Café noir');
		expect(folded).toBe('cafe noir');
		expect(originalIndexes(3, 4)).toEqual([3, 4]);
		expect(originalIndexes(5, 9)).toEqual([6, 7, 8, 9]);
	});

	it('keeps surrogate pairs whole', () => {
		const { folded, originalIndexes } = foldAccents('a😀b');
		expect(folded).toBe('a😀b');
		expect(originalIndexes(1, 3)).toEqual([1, 2]);
	});

	it('maps a span ending inside an expanded character to the whole character', () => {
		const { folded, originalIndexes } = foldAccents('ﬁx');
		expect(folded).toBe('fix');
		expect(originalIndexes(0, 1)).toEqual([0]);
	});

	describe('withCombiningMarks', () => {
		it('adds the combining marks that follow a matched letter', () => {
			expect(withCombiningMarks('re\u0301sume\u0301', [1, 6])).toEqual([
				1, 2, 6, 7,
			]);
		});

		it('leaves precomposed text unchanged', () => {
			expect(withCombiningMarks('résumé', [1, 5])).toEqual([1, 5]);
		});
	});
});
