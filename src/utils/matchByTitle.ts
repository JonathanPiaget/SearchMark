import fuzzysort from 'fuzzysort';
import { foldAccents } from '@/utils/foldAccents';
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
			.map((r) => ({ item: r.obj, indexes: r.indexes }));
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
		const folded = foldAccents(title);
		const start = folded.folded.indexOf(foldedQuery);
		return start === -1
			? null
			: folded.originalIndexes(start, start + foldedQuery.length);
	});
};
