import { foldAccents } from '@/utils/foldAccents';

const WORD = /[\p{L}\p{N}]+/gu;

const typoBudget = (length: number) => (length >= 9 ? 2 : length >= 5 ? 1 : 0);

const cell = (row: number[], j: number) => row[j] ?? Number.POSITIVE_INFINITY;

// Optimal string alignment: a swap of two adjacent letters costs one edit.
const damerauLevenshtein = (a: string, b: string, max: number): number => {
	if (Math.abs(a.length - b.length) > max) return max + 1;
	let beforePrevious: number[] = [];
	let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		const row = [i];
		for (let j = 1; j <= b.length; j++) {
			const substitution = a[i - 1] === b[j - 1] ? 0 : 1;
			let distance = Math.min(
				cell(previous, j) + 1,
				cell(row, j - 1) + 1,
				cell(previous, j - 1) + substitution,
			);
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
				distance = Math.min(distance, cell(beforePrevious, j - 2) + 1);
			row.push(distance);
		}
		if (Math.min(...row) > max) return max + 1;
		beforePrevious = previous;
		previous = row;
	}
	return cell(previous, b.length);
};

// Title words are cut to about the query word's length so a word still being typed matches.
const wordMatchesWithTypos = (titleWord: string, queryWord: string) => {
	const budget = typoBudget(queryWord.length);
	for (
		let cut = queryWord.length - budget;
		cut <= queryWord.length + budget;
		cut++
	) {
		if (
			damerauLevenshtein(queryWord, titleWord.slice(0, cut), budget) <= budget
		)
			return true;
	}
	return false;
};

export const matchWordsWithTypos = (
	title: string,
	query: string,
): number[] | null => {
	const queryWords = foldAccents(query).folded.match(WORD);
	if (!queryWords) return null;

	const { folded, originalIndexes } = foldAccents(title);
	const titleWords = [...folded.matchAll(WORD)];
	const indexes = new Set<number>();
	for (const queryWord of queryWords) {
		const titleWord = titleWords.find(([word]) =>
			wordMatchesWithTypos(word, queryWord),
		);
		if (!titleWord) return null;
		for (const index of originalIndexes(
			titleWord.index,
			titleWord.index + titleWord[0].length,
		))
			indexes.add(index);
	}
	return [...indexes].sort((a, b) => a - b);
};
