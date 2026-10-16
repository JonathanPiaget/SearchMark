import fuzzysort from 'fuzzysort';
import { foldAccents, withCombiningMarks } from '@/utils/foldAccents';
import { matchWordsWithTypos } from '@/utils/matchByTypos';

export const FUZZY_THRESHOLD = 0.3;

export interface TitleMatch<T> {
	item: T;
	indexes: readonly number[] | null;
}

const appendMatches = <T extends { title: string }>(
	matches: TitleMatch<T>[],
	items: T[],
	limit: number,
	indexesOf: (title: string) => readonly number[] | null,
): TitleMatch<T>[] => {
	for (const item of items) {
		if (matches.length >= limit) break;
		const indexes = indexesOf(item.title);
		if (indexes) matches.push({ item, indexes });
	}
	return matches;
};

export const matchByTitle = <T extends { title: string }>(
	items: T[],
	rawQuery: string,
	fuzzy: boolean,
	limit: number,
): TitleMatch<T>[] => {
	// fuzzysort folds decomposed titles but not a decomposed query.
	const query = rawQuery.normalize('NFC');
	if (!query.trim()) return [];

	if (fuzzy) {
		const fuzzyMatches: TitleMatch<T>[] = fuzzysort
			.go(query, items, { key: 'title', threshold: FUZZY_THRESHOLD, limit })
			.map((r) => ({
				item: r.obj,
				indexes: withCombiningMarks(r.obj.title, r.indexes),
			}));
		const found = new Set(fuzzyMatches.map((m) => m.item));
		return appendMatches(
			fuzzyMatches,
			items.filter((item) => !found.has(item)),
			limit,
			(title) => matchWordsWithTypos(title, query),
		);
	}

	const foldedQuery = foldAccents(query).folded;
	return appendMatches([], items, limit, (title) => {
		const { folded, originalIndexes } = foldAccents(title);
		const indexes: number[] = [];
		for (
			let start = folded.indexOf(foldedQuery);
			start !== -1;
			start = folded.indexOf(foldedQuery, start + foldedQuery.length)
		)
			indexes.push(...originalIndexes(start, start + foldedQuery.length));
		return indexes.length ? indexes : null;
	});
};
